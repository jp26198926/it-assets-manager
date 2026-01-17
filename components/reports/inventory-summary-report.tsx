"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  InventoryItemWithCategorySerialized,
  ItemStatus,
} from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";

interface InventorySummaryReportProps {
  items: InventoryItemWithCategorySerialized[];
}

const statusVariants: Record<
  ItemStatus,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  in_stock: "success",
  issued: "info",
  under_repair: "warning",
  beyond_repair: "destructive",
  disposed: "secondary",
};

export function InventorySummaryReport({ items }: InventorySummaryReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Item Name",
        "Barcode",
        "Category",
        "Brand",
        "Model",
        "Serial Number",
        "Status",
        "Location",
      ].join(","),
      ...items.map((item) =>
        [
          item.name,
          item.barcode,
          item.category?.name || "N/A",
          item.brand || "-",
          item.model || "-",
          item.serialNumber || "-",
          item.status,
          item.location || "-",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-summary-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Calculate statistics
  const stats = items.reduce(
    (acc, item) => {
      acc.total++;
      acc.byStatus[item.status] = (acc.byStatus[item.status] || 0) + 1;

      const categoryName = item.category?.name || "Uncategorized";
      acc.byCategory[categoryName] = (acc.byCategory[categoryName] || 0) + 1;

      return acc;
    },
    {
      total: 0,
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    },
  );

  const columns = [
    {
      key: "name",
      header: "Item Name",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {item.barcode}
          </p>
        </div>
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
      key: "serialNumber",
      header: "Serial Number",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <span className="text-sm font-mono">{item.serialNumber || "-"}</span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "location",
      header: "Location",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <span className="text-sm">{item.location || "-"}</span>
      ),
      className: "hidden xl:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <StatusBadge variant={statusVariants[item.status]}>
          {item.status.replace("_", " ")}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Actions - Hide on print */}
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

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        {Object.entries(stats.byStatus).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                {status.replace("_", " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((count / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <span className="font-medium">{category}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complete Inventory List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={items}
            columns={columns}
            searchPlaceholder="Search items..."
            emptyMessage="No items found"
          />
        </CardContent>
      </Card>

      {/* Print footer */}
      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
