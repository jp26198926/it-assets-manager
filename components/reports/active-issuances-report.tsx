"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { Issuance } from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";

interface ActiveIssuancesReportProps {
  issuances: Issuance[];
}

export function ActiveIssuancesReport({
  issuances,
}: ActiveIssuancesReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Item Name",
        "Barcode",
        "Issued To",
        "Type",
        "Issued By",
        "Issued Date",
        "Expected Return",
      ].join(","),
      ...issuances.map((issuance) =>
        [
          issuance.itemName,
          issuance.itemBarcode,
          issuance.issuedTo.name,
          issuance.issuedTo.type,
          issuance.issuedBy,
          format(new Date(issuance.issuedAt), "yyyy-MM-dd"),
          issuance.expectedReturn
            ? format(new Date(issuance.expectedReturn), "yyyy-MM-dd")
            : "N/A",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `active-issuances-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const groupedByType = issuances.reduce(
    (acc, issuance) => {
      const type = issuance.issuedTo.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(issuance);
      return acc;
    },
    {} as Record<string, Issuance[]>,
  );

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
      key: "issuedBy",
      header: "Issued By",
      cell: (issuance: Issuance) => (
        <span className="text-sm">{issuance.issuedBy}</span>
      ),
      className: "hidden md:table-cell",
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
      key: "expectedReturn",
      header: "Expected Return",
      cell: (issuance: Issuance) => (
        <span className="text-sm">
          {issuance.expectedReturn
            ? format(new Date(issuance.expectedReturn), "MMM d, yyyy")
            : "Not specified"}
        </span>
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
              Total Active Issuances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issued to Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groupedByType.employee?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issued to Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groupedByType.department?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Issuances List</CardTitle>
        </CardHeader>
        <CardContent>
          {issuances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active issuances
            </p>
          ) : (
            <DataTable
              data={issuances as any}
              columns={columns as any}
              searchPlaceholder="Search issuances..."
              emptyMessage="No issuances found"
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
