"use client";

import { useState, useTransition } from "react";
import type { Issuance } from "@/lib/models/types";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getIssuances } from "@/lib/actions/issuance";
import { format } from "date-fns";
import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReturnItemDialog } from "@/components/issuance/return-item-dialog";

export function IssuanceList({
  initialIssuances,
}: {
  initialIssuances: Issuance[];
}) {
  const router = useRouter();
  const [issuances, setIssuances] = useState(initialIssuances);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedIssuance, setSelectedIssuance] = useState<Issuance | null>(
    null
  );

  const handleFilterChange = (newSearch: string, newStatus: string) => {
    startTransition(async () => {
      const filters: { status?: "active" | "returned"; search?: string } = {};
      if (newStatus !== "all")
        filters.status = newStatus as "active" | "returned";
      if (newSearch) filters.search = newSearch;

      const filtered = await getIssuances(filters);
      setIssuances(filtered);
    });
  };

  const handleReturnClick = (issuance: Issuance) => {
    setSelectedIssuance(issuance);
    setReturnDialogOpen(true);
  };

  const handleReturnSuccess = () => {
    router.refresh();
    handleFilterChange(search, statusFilter);
  };

  const columns = [
    {
      key: "itemBarcode",
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
      className: "hidden md:table-cell",
    },
    {
      key: "issuedBy",
      header: "Issued By",
      cell: (issuance: Issuance) => (
        <span className="text-sm text-muted-foreground">
          {issuance.issuedBy}
        </span>
      ),
      className: "hidden lg:table-cell",
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
      key: "actions",
      header: "",
      cell: (issuance: Issuance) =>
        issuance.status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReturnClick(issuance)}
          >
            <Undo2 className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Return</span>
          </Button>
        ),
      className: "w-[100px]",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            handleFilterChange(search, value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={issuances}
        columns={columns}
        searchPlaceholder="Search by item name, barcode, or recipient..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          handleFilterChange(value, statusFilter);
        }}
        emptyMessage={isPending ? "Loading..." : "No issuance records found"}
      />

      {selectedIssuance && (
        <ReturnItemDialog
          issuance={selectedIssuance}
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
}
