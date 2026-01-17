"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  InventoryItemWithCategorySerialized,
  ItemStatus,
} from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface ItemsByStatusReportProps {
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

const statuses: ItemStatus[] = [
  "in_stock",
  "issued",
  "under_repair",
  "beyond_repair",
  "disposed",
];

export function ItemsByStatusReport({ items }: ItemsByStatusReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ["Status", "Item Name", "Barcode", "Category", "Location"].join(","),
      ...items.map((item) =>
        [
          item.status,
          item.name,
          item.barcode,
          item.category?.name || "N/A",
          item.location || "-",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items-by-status-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const groupedByStatus = items.reduce(
    (acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push(item);
      return acc;
    },
    {} as Record<ItemStatus, InventoryItemWithCategorySerialized[]>,
  );

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

      {statuses.map((status) => {
        const statusItems = groupedByStatus[status] || [];
        if (statusItems.length === 0) return null;

        return (
          <Card key={status}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize flex items-center gap-2">
                  <StatusBadge variant={statusVariants[status]}>
                    {status.replace("_", " ")}
                  </StatusBadge>
                  <span className="text-muted-foreground text-base">
                    ({statusItems.length} items)
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusItems.map((item) => (
                  <Link
                    key={item._id}
                    href={`/inventory/${item._id}`}
                    className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors print:hover:bg-secondary/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.barcode} • {item.category?.name || "N/A"}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {item.location || "No location"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
