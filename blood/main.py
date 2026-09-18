from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
import mysql.connector
from mysql.connector import Error, pooling
import os
import logging
from typing import List
import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_db_host = os.getenv("MYSQL_HOST", "localhost")
_db_port = int(os.getenv("MYSQL_PORT", "3306"))
_db_user = os.getenv("MYSQL_USER", "root")
_db_password = os.getenv("MYSQL_PASSWORD", "")
_db_name = os.getenv("MYSQL_DATABASE", "blood_bank_db")

db_pool: mysql.connector.pooling.MySQLConnectionPool | None = None


def _create_pool() -> mysql.connector.pooling.MySQLConnectionPool:
    return mysql.connector.pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        pool_reset_session=True,
        host=_db_host,
        port=_db_port,
        user=_db_user,
        password=_db_password,
        database=_db_name,
    )


def ensure_db_pool() -> bool:
    global db_pool
    if db_pool is not None:
        return True
    try:
        db_pool = _create_pool()
        logger.info("Database connection pool created successfully.")
        return True
    except Error as e:
        logger.error("Database connection pool error: %s", e)
        db_pool = None
        return False


ensure_db_pool()

app = FastAPI(title="Blood Bank API")

_cors_raw = os.getenv("CORS_ORIGINS", "*").strip()
_cors_origins = ["*"] if _cors_raw == "*" else [o.strip() for o in _cors_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True if _cors_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# --- Pydantic Models ---

class BaseRecord(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=18, le=65)
    gender: str = Field(..., min_length=1)
    blood_group: str = Field(..., min_length=1)
    contact_number: str = Field(..., pattern=r'^[0-9]{10}$')

class DonorCreate(BaseRecord):
    pass

class Donor(BaseRecord):
    donor_id: int

class RecipientCreate(BaseRecord):
    pass

class Recipient(BaseRecord):
    recipient_id: int

class BloodInventoryItem(BaseModel):
    blood_group: str
    quantity: int

class StaffCreate(BaseModel):
    name: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    contact_number: str = Field(..., pattern=r'^[0-9]{10}$')

class Staff(StaffCreate):
    staff_id: int

class DonationCreate(BaseModel):
    donor_id: int
    donation_date: datetime.date

class Donation(DonationCreate):
    donation_id: int

class TransfusionCreate(BaseModel):
    recipient_id: int
    transfusion_date: datetime.date

class Transfusion(TransfusionCreate):
    transfusion_id: int

class BloodTestCreate(BaseModel):
    donor_id: int
    test_date: datetime.date
    result: str = Field(..., min_length=1)

class BloodTest(BloodTestCreate):
    test_id: int

class ReportData(BaseModel):
    donors: List[Donor]
    recipients: List[Recipient]
    inventory: List[BloodInventoryItem]


# --- Database Dependency ---

def get_db_connection():
    if not ensure_db_pool() or not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable. Check MySQL is running and credentials in .env")
    try:
        conn = db_pool.get_connection()
        if conn.is_connected():
            return conn
        raise HTTPException(status_code=503, detail="Failed to get valid database connection")
    except HTTPException:
        raise
    except Error as e:
        logger.exception("Database connection error")
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

# --- Utility Functions (Validation already handled by Pydantic) ---
# validate_contact and validate_age are replaced by Pydantic model validation

# --- API Endpoints ---

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Blood Bank API"}

@app.post("/donors/", response_model=Donor, status_code=201)
async def create_donor(donor: DonorCreate, conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO Donors (name, age, gender, blood_group, contact_number)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            donor.name, donor.age, donor.gender, donor.blood_group, donor.contact_number
        ))
        conn.commit()
        donor_id = cursor.lastrowid
        cursor.close()
        return Donor(donor_id=donor_id, **donor.model_dump())
    except HTTPException:
        raise
    except Error as e:
        conn.rollback()
        logger.exception("create_donor failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.get("/donors/", response_model=List[Donor])
async def list_donors(conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT donor_id, name, age, gender, blood_group, contact_number FROM Donors ORDER BY donor_id"
        )
        rows = cursor.fetchall()
        cursor.close()
        return [Donor(**row) for row in rows]
    except HTTPException:
        raise
    except ValidationError as ve:
        raise HTTPException(status_code=500, detail=f"Data validation error: {str(ve)}")
    except Error as e:
        logger.exception("list_donors failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.post("/recipients/", response_model=Recipient, status_code=201)
async def create_recipient(recipient: RecipientCreate, conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO Recipients (name, age, gender, blood_group, contact_number)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            recipient.name, recipient.age, recipient.gender, recipient.blood_group, recipient.contact_number
        ))
        conn.commit()
        recipient_id = cursor.lastrowid
        cursor.close()
        return Recipient(recipient_id=recipient_id, **recipient.model_dump())
    except HTTPException:
        raise
    except Error as e:
        conn.rollback()
        logger.exception("create_recipient failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.get("/recipients/", response_model=List[Recipient])
async def list_recipients(conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT recipient_id, name, age, gender, blood_group, contact_number FROM Recipients ORDER BY recipient_id"
        )
        rows = cursor.fetchall()
        cursor.close()
        return [Recipient(**row) for row in rows]
    except HTTPException:
        raise
    except ValidationError as ve:
        raise HTTPException(status_code=500, detail=f"Data validation error: {str(ve)}")
    except Error as e:
        logger.exception("list_recipients failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.get("/blood_inventory/", response_model=List[BloodInventoryItem])
async def get_blood_inventory(conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT blood_group, quantity FROM Blood_Inventory")
        inventory_data = cursor.fetchall()
        cursor.close()
        validated_data = [BloodInventoryItem(**item) for item in inventory_data]
        return validated_data
    except HTTPException:
        raise
    except ValidationError as ve:
        raise HTTPException(status_code=500, detail=f"Data validation error: {str(ve)}")
    except Error as e:
        logger.exception("get_blood_inventory failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.post("/staff/", response_model=Staff, status_code=201)
async def add_staff(staff: StaffCreate, conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO Staff (name, role, contact_number)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (staff.name, staff.role, staff.contact_number))
        conn.commit()
        staff_id = cursor.lastrowid
        cursor.close()
        return Staff(staff_id=staff_id, **staff.model_dump())
    except HTTPException:
        raise
    except Error as e:
        conn.rollback()
        logger.exception("add_staff failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.post("/donations/", response_model=Donation, status_code=201)
async def record_donation(donation: DonationCreate, conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor(dictionary=True) # Use dictionary cursor for easier access

        # --- 1. Verify donor exists ---
        cursor.execute("SELECT blood_group FROM Donors WHERE donor_id = %s", (donation.donor_id,))
        donor_record = cursor.fetchone()
        if not donor_record:
            raise HTTPException(status_code=404, detail=f"Donor with ID {donation.donor_id} not found.")
        donor_blood_group = donor_record['blood_group']

        # --- 2. Insert donation record ---
        insert_donation_query = """
            INSERT INTO Donations (donor_id, donation_date)
            VALUES (%s, %s)
        """
        cursor.execute(insert_donation_query, (donation.donor_id, donation.donation_date))
        donation_id = cursor.lastrowid

        # --- 3. Update blood inventory ---
        # Check if blood group exists in inventory
        cursor.execute("SELECT quantity FROM Blood_Inventory WHERE blood_group = %s", (donor_blood_group,))
        inventory_record = cursor.fetchone()

        if inventory_record:
            # Update existing inventory
            update_inventory_query = """
                UPDATE Blood_Inventory SET quantity = quantity + 1
                WHERE blood_group = %s
            """
            cursor.execute(update_inventory_query, (donor_blood_group,))
        else:
            # Insert new inventory record
            insert_inventory_query = """
                INSERT INTO Blood_Inventory (blood_group, quantity)
                VALUES (%s, 1)
            """
            cursor.execute(insert_inventory_query, (donor_blood_group,))

        # --- 4. Commit transaction ---
        conn.commit()
        cursor.close()
        # Return the created donation object using the input data and the generated ID
        # We need to fetch the donation details again or construct it
        # For simplicity, we return based on input + ID
        # Fetching the full object might be better in a real app
        return Donation(donation_id=donation_id, donor_id=donation.donor_id, donation_date=donation.donation_date)

    except HTTPException:
        raise
    except Error as e:
        conn.rollback()
        logger.exception("record_donation failed")
        raise HTTPException(status_code=500, detail=f"Database error during donation recording: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.post("/transfusions/", response_model=Transfusion, status_code=201)
async def record_transfusion(transfusion: TransfusionCreate, conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT 1 FROM Recipients WHERE recipient_id = %s",
            (transfusion.recipient_id,),
        )
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail=f"Recipient with ID {transfusion.recipient_id} not found.",
            )
        query = """
            INSERT INTO Transfusions (recipient_id, transfusion_date)
            VALUES (%s, %s)
        """
        cursor.execute(query, (transfusion.recipient_id, transfusion.transfusion_date))
        conn.commit()
        transfusion_id = cursor.lastrowid
        cursor.close()
        return Transfusion(transfusion_id=transfusion_id, **transfusion.model_dump())
    except HTTPException:
        raise
    except Error as e:
        conn.rollback()
        logger.exception("record_transfusion failed")
        if "FOREIGN KEY (`recipient_id`)" in str(e):
            raise HTTPException(
                status_code=404,
                detail=f"Recipient with ID {transfusion.recipient_id} not found.",
            )
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.post("/blood_tests/", response_model=BloodTest, status_code=201)
async def record_blood_test(test: BloodTestCreate, conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM Donors WHERE donor_id = %s", (test.donor_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail=f"Donor with ID {test.donor_id} not found.",
            )
        query = """
            INSERT INTO Blood_Tests (donor_id, test_date, result)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (test.donor_id, test.test_date, test.result))
        conn.commit()
        test_id = cursor.lastrowid
        cursor.close()
        return BloodTest(test_id=test_id, **test.model_dump())
    except HTTPException:
        raise
    except Error as e:
        conn.rollback()
        logger.exception("record_blood_test failed")
        if "FOREIGN KEY (`donor_id`)" in str(e):
            raise HTTPException(
                status_code=404,
                detail=f"Donor with ID {test.donor_id} not found.",
            )
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.get("/reports/", response_model=ReportData)
async def get_reports(conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT donor_id, name, age, gender, blood_group, contact_number FROM Donors")
        donors_raw = cursor.fetchall()

        cursor.execute("SELECT recipient_id, name, age, gender, blood_group, contact_number FROM Recipients")
        recipients_raw = cursor.fetchall()

        cursor.execute("SELECT blood_group, quantity FROM Blood_Inventory")
        inventory_raw = cursor.fetchall()

        cursor.close()

        donors = [Donor(**d) for d in donors_raw]
        recipients = [Recipient(**r) for r in recipients_raw]
        inventory = [BloodInventoryItem(**i) for i in inventory_raw]

        return ReportData(donors=donors, recipients=recipients, inventory=inventory)
    except HTTPException:
        raise
    except ValidationError as ve:
        raise HTTPException(status_code=500, detail=f"Report data validation error: {str(ve)}")
    except Error as e:
        logger.exception("get_reports failed")
        raise HTTPException(status_code=500, detail=f"Database error fetching reports: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()


if __name__ == "__main__":
    import uvicorn

    _port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=_port)
