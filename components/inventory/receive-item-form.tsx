"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createInventoryItem } from "@/lib/actions/inventory"
import type { ItemCategory } from "@/lib/models/types"
import { BarcodeDisplay } from "@/components/barcode/barcode-display"
import { CheckCircle2, Loader2 } from "lucide-react"

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

export function ReceiveItemForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createInventoryItem({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as ItemCategory,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        serialNumber: formData.get("serialNumber") as string,
        purchaseDate: formData.get("purchaseDate") as string,
        purchasePrice: formData.get("purchasePrice") ? Number(formData.get("purchasePrice")) : undefined,
        warrantyExpiry: formData.get("warrantyExpiry") as string,
        location: formData.get("location") as string,
        notes: formData.get("notes") as string,
      })

      if (result.success && result.item) {
        setSuccess(true)
        setGeneratedBarcode(result.item.barcode)
      } else {
        setError(result.error || "Failed to create item")
      }
    })
  }

  if (success && generatedBarcode) {
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
              <h2 className="text-xl font-semibold">Item Registered Successfully</h2>
              <p className="text-muted-foreground mt-1">A barcode has been generated for this item</p>
            </div>
            <div className="flex flex-col items-center gap-4 py-4">
              <BarcodeDisplay value={generatedBarcode} type="qr" size={200} />
              <p className="font-mono text-lg">{generatedBarcode}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.print()}>
                Print Barcode
              </Button>
              <Button
                onClick={() => {
                  setSuccess(false)
                  setGeneratedBarcode(null)
                }}
              >
                Register Another Item
              </Button>
              <Button variant="secondary" onClick={() => router.push("/inventory")}>
                View Inventory
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" name="name" required className="bg-secondary" placeholder="e.g., Dell Latitude 5520" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
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
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" className="bg-secondary" placeholder="e.g., Dell" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" className="bg-secondary" placeholder="e.g., Latitude 5520" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" name="serialNumber" className="bg-secondary" placeholder="Enter serial number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                className="bg-secondary"
                placeholder="Additional details about the item"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" className="bg-secondary" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                step="0.01"
                className="bg-secondary"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input id="warrantyExpiry" name="warrantyExpiry" type="date" className="bg-secondary" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" className="bg-secondary" placeholder="e.g., IT Storage Room A" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" className="bg-secondary" placeholder="Any additional notes" />
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
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Register Item & Generate Barcode
        </Button>
      </div>
    </form>
  )
}
