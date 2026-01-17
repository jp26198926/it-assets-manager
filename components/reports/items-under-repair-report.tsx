"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { InventoryItemWithCategorySerialized } from "@/lib/models/types";
import { Download, Printer, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface ItemsUnderRepairReportProps {
  items: InventoryItemWithCategorySerialized[];
}

export function ItemsUnderRepairReport({ items }: ItemsUnderRepairReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ["Item Name", "Barcode", "Category", "Location", "Last Updated"].join(
        ",",
      ),
      ...items.map((item) =>
        [
          item.name,
          item.barcode,
          item.category?.name || "N/A",
          item.location || "-",
          format(new Date(item.updatedAt), "yyyy-MM-dd"),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items-under-repair-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const columns = [
    {
      key: "name",
      header: "Item Name",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <Link href={`/inventory/${item._id}`} className="hover:underline">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {item.barcode}
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <span className="text-sm">{item.category?.name || "N/A"}</span>
      ),
    },
    {
      key: "brand",
      header: "Brand/Model",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <div className="text-sm">
          <p>{item.brand || "-"}</p>
          <p className="text-xs text-muted-foreground">{item.model || "-"}</p>
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "location",
      header: "Location",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <span className="text-sm">{item.location || "-"}</span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <span className="text-sm">
          {format(new Date(item.updatedAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <StatusBadge variant="warning">Under Repair</StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Items Currently Under Repair ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No items currently under repair
            </p>
          ) : (
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Search items..."
              emptyMessage="No items found"
            />
          )}
        </CardContent>
      </Card>

      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
