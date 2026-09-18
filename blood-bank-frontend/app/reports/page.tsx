"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ClipboardList, Download, RefreshCw } from "lucide-react"
import { getBackendBaseUrl } from "@/lib/api"

type Donor = {
  donor_id: number
  name: string
  age: number
  gender: string
  blood_group: string
  contact_number: string
}

type Recipient = {
  recipient_id: number
  name: string
  age: number
  gender: string
  blood_group: string
  contact_number: string
}

type InventoryItem = {
  blood_group: string
  quantity: number
}

export default function ReportsPage() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null) // Reset error state
      try {
        // Fetch data from backend
        const response = await fetch(`${getBackendBaseUrl()}/reports/`)
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();

        setDonors(data.donors || [])
        setRecipients(data.recipients || [])
        setInventory(data.inventory || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()

    // Optional: Set up polling for real-time updates
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${getBackendBaseUrl()}/reports/`)
        if (!response.ok) {
          console.error("Periodic report fetch failed")
        } else {
          const data = await response.json()
          setDonors(data.donors || [])
          setRecipients(data.recipients || [])
          setInventory(data.inventory || [])
        }
      } catch (error) {
        console.error(
          "Error in periodic report fetch:",
          error instanceof Error ? error.message : "An unknown error occurred",
        )
      }
    }, 10000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const refreshReports = async () => {
    setLoading(true)
    setError(null) // Reset error state
    try {
      // Refresh data from the backend
      const response = await fetch(`${getBackendBaseUrl()}/reports/`)
      if (!response.ok) {
        throw new Error('Failed to refresh reports');
      }
      const data = await response.json();

      setDonors(data.donors || [])
      setRecipients(data.recipients || [])
      setInventory(data.inventory || [])

    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (reportType: string) => {
    // In a real application, this would generate and download a report
    alert(`Downloading ${reportType} report...`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">View and generate blood bank reports</p>
        </div>
        <Button onClick={refreshReports} disabled={loading} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="donors">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="donors">Donors</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="donors" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-red-500" />
                  Donor Report
                </CardTitle>
                <CardDescription>List of all registered blood donors</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport("donors")}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">Loading donor data...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((donor) => (
                      <TableRow key={donor.donor_id}>
                        <TableCell>{donor.donor_id}</TableCell>
                        <TableCell className="font-medium">{donor.name}</TableCell>
                        <TableCell>{donor.age}</TableCell>
                        <TableCell>{donor.gender}</TableCell>
                        <TableCell>{donor.blood_group}</TableCell>
                        <TableCell>{donor.contact_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Recipient Report
                </CardTitle>
                <CardDescription>List of all registered blood recipients</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport("recipients")}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">Loading recipient data...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map((recipient) => (
                      <TableRow key={recipient.recipient_id}>
                        <TableCell>{recipient.recipient_id}</TableCell>
                        <TableCell className="font-medium">{recipient.name}</TableCell>
                        <TableCell>{recipient.age}</TableCell>
                        <TableCell>{recipient.gender}</TableCell>
                        <TableCell>{recipient.blood_group}</TableCell>
                        <TableCell>{recipient.contact_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-red-600" />
                  Inventory Report
                </CardTitle>
                <CardDescription>Current blood inventory status</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport("inventory")}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">Loading inventory data...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Quantity (Units)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.blood_group}>
                        <TableCell className="font-medium">{item.blood_group}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
