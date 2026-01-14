"use client"

import { useState, useTransition } from "react"
import type { InventoryItem, ItemStatus, ItemCategory } from "@/lib/models/types"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, QrCode } from "lucide-react"
import Link from "next/link"
import { getInventoryItems } from "@/lib/actions/inventory"
import { BarcodeDisplay } from "@/components/barcode/barcode-display"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const statusVariants: Record<ItemStatus, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  in_stock: "success",
  issued: "info",
  under_repair: "warning",
  beyond_repair: "destructive",
  disposed: "secondary",
}

const categoryLabels: Record<ItemCategory, string> = {
  laptop: "Laptop",
  desktop: "Desktop",
  monitor: "Monitor",
  keyboard: "Keyboard",
  mouse: "Mouse",
  printer: "Printer",
  network: "Network Device",
  storage: "Storage Device",
  accessory: "Accessory",
  other: "Other",
}

export function InventoryList({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isPending, startTransition] = useTransition()
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedBarcode, setSelectedBarcode] = useState("")

  const handleFilterChange = (newSearch: string, newStatus: string, newCategory: string) => {
    startTransition(async () => {
      const filters: { status?: ItemStatus; category?: ItemCategory; search?: string } = {}
      if (newStatus !== "all") filters.status = newStatus as ItemStatus
      if (newCategory !== "all") filters.category = newCategory as ItemCategory
      if (newSearch) filters.search = newSearch

      const filtered = await getInventoryItems(filters)
      setItems(filtered)
    })
  }

  const showQrCode = (barcode: string) => {
    setSelectedBarcode(barcode)
    setQrDialogOpen(true)
  }

  const columns = [
    {
      key: "barcode",
      header: "Barcode",
      cell: (item: InventoryItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => showQrCode(item.barcode)}
            className="text-primary hover:underline font-mono text-sm flex items-center gap-1"
          >
            <QrCode className="h-4 w-4" />
            {item.barcode}
          </button>
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (item: InventoryItem) => (
        <div>
          <p className="font-medium">{item.name}</p>
          {item.brand && (
            <p className="text-xs text-muted-foreground">
              {item.brand} {item.model}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: InventoryItem) => <span className="text-sm">{categoryLabels[item.category]}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (item: InventoryItem) => (
        <StatusBadge variant={statusVariants[item.status]}>{item.status.replace("_", " ")}</StatusBadge>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (item: InventoryItem) => <span className="text-sm text-muted-foreground">{item.location || "-"}</span>,
      className: "hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "",
      cell: (item: InventoryItem) => (
        <Link href={`/inventory/${item._id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
      className: "w-[50px]",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            handleFilterChange(search, value, categoryFilter)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="under_repair">Under Repair</SelectItem>
            <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value)
            handleFilterChange(search, statusFilter, value)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search by name, barcode, or serial number..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          handleFilterChange(value, statusFilter, categoryFilter)
        }}
        emptyMessage={isPending ? "Loading..." : "No inventory items found"}
      />

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <BarcodeDisplay value={selectedBarcode} type="qr" size={200} />
            <p className="font-mono text-sm">{selectedBarcode}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
