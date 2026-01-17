"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Issuance } from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";

interface IssuanceHistoryReportProps {
  issuances: Issuance[];
}

export function IssuanceHistoryReport({
  issuances,
}: IssuanceHistoryReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Item Name",
        "Barcode",
        "Issued To",
        "Issued Date",
        "Returned Date",
        "Status",
        "Return Status",
      ].join(","),
      ...issuances.map((issuance) =>
        [
          issuance.itemName,
          issuance.itemBarcode,
          issuance.issuedTo.name,
          format(new Date(issuance.issuedAt), "yyyy-MM-dd"),
          issuance.returnedAt
            ? format(new Date(issuance.returnedAt), "yyyy-MM-dd")
            : "N/A",
          issuance.status,
          issuance.returnStatus || "N/A",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issuance-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const activeCount = issuances.filter((i) => i.status === "active").length;
  const returnedCount = issuances.filter((i) => i.status === "returned").length;

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
      key: "issuedAt",
      header: "Issued Date",
      cell: (issuance: Issuance) => (
        <span className="text-sm">
          {format(new Date(issuance.issuedAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "returnedAt",
      header: "Returned Date",
      cell: (issuance: Issuance) => (
        <span className="text-sm">
          {issuance.returnedAt
            ? format(new Date(issuance.returnedAt), "MMM d, yyyy")
            : "-"}
        </span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (issuance: Issuance) => (
        <StatusBadge
          variant={issuance.status === "active" ? "info" : "secondary"}
        >
          {issuance.status}
        </StatusBadge>
      ),
    },
    {
      key: "returnStatus",
      header: "Return Status",
      cell: (issuance: Issuance) => (
        <>
          {issuance.returnStatus && (
            <StatusBadge
              variant={
                issuance.returnStatus === "good"
                  ? "success"
                  : issuance.returnStatus === "beyond_repair"
                    ? "destructive"
                    : "warning"
              }
            >
              {issuance.returnStatus.replace("_", " ")}
            </StatusBadge>
          )}
        </>
      ),
      className: "hidden lg:table-cell",
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issuances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Returned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complete Issuance History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={issuances as any}
            columns={columns as any}
            searchPlaceholder="Search issuances..."
            emptyMessage="No issuances found"
          />
        </CardContent>
      </Card>

      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
