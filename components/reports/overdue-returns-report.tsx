"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Issuance } from "@/lib/models/types";
import { Download, Printer, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface OverdueReturnsReportProps {
  issuances: Issuance[];
}

export function OverdueReturnsReport({ issuances }: OverdueReturnsReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Item Name",
        "Barcode",
        "Issued To",
        "Expected Return",
        "Days Overdue",
      ].join(","),
      ...issuances.map((issuance) => {
        const daysOverdue = differenceInDays(
          new Date(),
          new Date(issuance.expectedReturn!),
        );
        return [
          issuance.itemName,
          issuance.itemBarcode,
          issuance.issuedTo.name,
          format(new Date(issuance.expectedReturn!), "yyyy-MM-dd"),
          daysOverdue,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overdue-returns-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const columns = [
    {
      key: "itemName",
      header: "Item",
      cell: (issuance: Issuance) => (
        <div>
          <p className="font-medium">{issuance.itemName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {issuance.itemBarcode}
          </p>
        </div>
      ),
    },
    {
      key: "issuedTo",
      header: "Issued To",
      cell: (issuance: Issuance) => (
        <div>
          <p className="font-medium">{issuance.issuedTo.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {issuance.issuedTo.type}
          </p>
        </div>
      ),
    },
    {
      key: "expectedReturn",
      header: "Expected Return",
      cell: (issuance: Issuance) => (
        <span className="text-sm">
          {format(new Date(issuance.expectedReturn!), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "daysOverdue",
      header: "Days Overdue",
      cell: (issuance: Issuance) => {
        const daysOverdue = differenceInDays(
          new Date(),
          new Date(issuance.expectedReturn!),
        );
        return (
          <StatusBadge variant={daysOverdue > 30 ? "destructive" : "warning"}>
            {daysOverdue} {daysOverdue === 1 ? "day" : "days"}
          </StatusBadge>
        );
      },
    },
  ];

  // Sort by days overdue (most overdue first)
  const sortedIssuances = [...issuances].sort((a, b) => {
    const daysA = differenceInDays(new Date(), new Date(a.expectedReturn!));
    const daysB = differenceInDays(new Date(), new Date(b.expectedReturn!));
    return daysB - daysA;
  });

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

      <Card className="border-warning">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Overdue Returns ({issuances.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {issuances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No overdue returns - all items are on schedule!
            </p>
          ) : (
            <DataTable
              data={sortedIssuances as any}
              columns={columns as any}
              searchPlaceholder="Search overdue items..."
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
