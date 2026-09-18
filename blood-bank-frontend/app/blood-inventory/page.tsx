"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Droplet, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBackendBaseUrl } from "@/lib/api"

// Updated type to match backend Pydantic model
type BloodInventoryItem = {
  blood_group: string;
  quantity: number;
  // inventory_id is no longer part of the response for this list
  // last_updated is no longer part of the response for this list
};

export default function BloodInventoryPage() {
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${getBackendBaseUrl()}/blood_inventory/`)
        if (!response.ok) {
          throw new Error('Failed to fetch inventory')
        }
        const data: BloodInventoryItem[] = await response.json() // Expecting an array directly
        setInventory(data || []) // Backend returns a list directly
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${getBackendBaseUrl()}/blood_inventory/`)
        if (!response.ok) {
          console.error('Periodic fetch failed')
          // Optionally, update error state here for periodic fetches
        } else {
          const data: BloodInventoryItem[] = await response.json();
          setInventory(data || []);
        }
      } catch (error) {
        console.error('Error in periodic fetch:', error)
        // Optionally, update error state here
      }
    }, 5000) // Consider making interval configurable or longer

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const refreshInventory = async () => {
    setLoading(true)
    setError(null)
    try {
        const response = await fetch(`${getBackendBaseUrl()}/blood_inventory/`)
      if (!response.ok) {
        throw new Error('Failed to refresh inventory')
      }
      const data: BloodInventoryItem[] = await response.json() // Expecting an array directly
      setInventory(data || []) // Backend returns a list directly
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blood Inventory</h1>
          <p className="text-muted-foreground">Manage and monitor blood stock levels</p>
        </div>
        <Button onClick={refreshInventory} disabled={loading} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : inventory.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-red-600" />
            Blood Inventory Status
          </CardTitle>
          <CardDescription>Current blood stock levels</CardDescription>
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
    </div>
  )
}
