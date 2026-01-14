"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createRepairRecord } from "@/lib/actions/repairs"
import { createInventoryItem, getInventoryItemByBarcode } from "@/lib/actions/inventory"
import type { Ticket, InventoryItem, ItemCategory } from "@/lib/models/types"
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Plus } from "lucide-react"
import Link from "next/link"
import { BarcodeScanner } from "@/components/barcode/barcode-scanner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface StartRepairFormProps {
  tickets: Ticket[]
  items: InventoryItem[]
  preselectedTicketId?: string
  preselectedBarcode?: string
}

const categories: { value: ItemCategory; label: string }[] = [
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Desktop" },
  { value: "monitor", label: "Monitor" },
  { value: "keyboard", label: "Keyboard" },
  { value: "mouse", label: "Mouse" },
  { value: "printer", label: "Printer" },
  { value: "network", label: "Network Device" },
  { value: "storage", label: "Storage Device" },
  { value: "accessory", label: "Accessory" },
  { value: "other", label: "Other" },
]

export function StartRepairForm({ tickets, items, preselectedTicketId, preselectedBarcode }: StartRepairFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedTicketId, setSelectedTicketId] = useState(preselectedTicketId || "")
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null)
  const [itemNotFound, setItemNotFound] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [registerPending, setRegisterPending] = useState(false)

  useEffect(() => {
    if (preselectedBarcode) {
      handleBarcodeScanned(preselectedBarcode)
    }
  }, [preselectedBarcode])

  const handleBarcodeScanned = async (barcode: string) => {
    setScannedBarcode(barcode)
    const item = await getInventoryItemByBarcode(barcode)

    if (item) {
      setScannedItem(item)
      setItemNotFound(false)
      setError(null)
    } else {
      setScannedItem(null)
      setItemNotFound(true)
      setShowRegisterDialog(true)
    }
  }

  const handleRegisterItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setRegisterPending(true)

    const formData = new FormData(e.currentTarget)

    const result = await createInventoryItem({
      name: formData.get("name") as string,
      category: formData.get("category") as ItemCategory,
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      serialNumber: formData.get("serialNumber") as string,
      notes: `Registered during repair intake. Original barcode scan: ${scannedBarcode}`,
    })

    if (result.success && result.item) {
      setScannedItem(result.item)
      setItemNotFound(false)
      setShowRegisterDialog(false)
    } else {
      setError(result.error || "Failed to register item")
    }

    setRegisterPending(false)
  }

  const selectedTicket = tickets.find((t) => t._id?.toString() === selectedTicketId)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!selectedTicketId) {
      setError("Please select a ticket")
      return
    }

    if (!scannedItem) {
      setError("Please scan or register an item")
      return
    }

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createRepairRecord({
        ticketId: selectedTicketId,
        ticketNumber: selectedTicket!.ticketNumber,
        itemId: scannedItem._id!.toString(),
        itemBarcode: scannedItem.barcode,
        itemName: scannedItem.name,
        technicianName: formData.get("technicianName") as string,
        diagnosis: formData.get("diagnosis") as string,
        notes: formData.get("notes") as string,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to create repair record")
      }
    })
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-success/20 p-3">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Repair Record Created</h2>
              <p className="text-muted-foreground mt-1">The item has been received for repair</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false)
                  setSelectedTicketId("")
                  setScannedItem(null)
                }}
              >
                Start Another Repair
              </Button>
              <Button onClick={() => router.push("/repairs")}>View All Repairs</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Select Ticket</CardTitle>
              <CardDescription>Choose the support ticket for this repair</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Support Ticket *</Label>
                <Select value={selectedTicketId} onValueChange={setSelectedTicketId}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select a ticket" />
                  </SelectTrigger>
                  <SelectContent>
                    {tickets.map((ticket) => (
                      <SelectItem key={ticket._id?.toString()} value={ticket._id!.toString()}>
                        {ticket.ticketNumber} - {ticket.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTicket && (
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <p className="font-medium">{selectedTicket.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                  <p className="text-sm">
                    Reporter: {selectedTicket.reportedBy.name} ({selectedTicket.reportedBy.email})
                  </p>
                  {selectedTicket.itemBarcode && (
                    <p className="text-sm font-mono">Item: {selectedTicket.itemBarcode}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Scan Item</CardTitle>
              <CardDescription>Scan the barcode to verify or register the item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Scan Barcode</Label>
                <BarcodeScanner onScan={handleBarcodeScanned} placeholder="Enter or scan item barcode..." />
              </div>

              {scannedItem && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Item Found</p>
                      <p className="text-sm">{scannedItem.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{scannedItem.barcode}</p>
                      <p className="text-sm text-muted-foreground">Status: {scannedItem.status.replace("_", " ")}</p>
                    </div>
                  </div>
                </div>
              )}

              {itemNotFound && !scannedItem && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Item Not Found</p>
                      <p className="text-sm text-muted-foreground">
                        Barcode "{scannedBarcode}" is not registered in the system.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => setShowRegisterDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Register Item
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Step 3: Repair Details</CardTitle>
              <CardDescription>Enter repair information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="technicianName">Technician Name *</Label>
                  <Input
                    id="technicianName"
                    name="technicianName"
                    required
                    className="bg-secondary"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="diagnosis">Initial Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    name="diagnosis"
                    className="bg-secondary"
                    placeholder="Initial assessment of the issue"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" className="bg-secondary" placeholder="Any additional notes" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-destructive/20 border border-destructive/30 rounded-lg text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/repairs">
            <Button type="button" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isPending || !selectedTicketId || !scannedItem}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Receive Item for Repair
          </Button>
        </div>
      </form>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Item Name *</Label>
              <Input id="reg-name" name="name" required className="bg-secondary" placeholder="e.g., Dell Laptop" />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select name="category" required>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-brand">Brand</Label>
                <Input id="reg-brand" name="brand" className="bg-secondary" placeholder="e.g., Dell" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-model">Model</Label>
                <Input id="reg-model" name="model" className="bg-secondary" placeholder="e.g., Latitude 5520" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-serial">Serial Number</Label>
              <Input id="reg-serial" name="serialNumber" className="bg-secondary" placeholder="Enter serial number" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRegisterDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={registerPending}>
                {registerPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Register & Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
