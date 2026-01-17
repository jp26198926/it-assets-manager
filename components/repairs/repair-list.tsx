"use client";

import { useState, useTransition } from "react";
import type { RepairRecord, RepairOutcome } from "@/lib/models/types";
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
import { Eye } from "lucide-react";
import Link from "next/link";
import { getRepairsWithTechnician } from "@/lib/actions/repairs";
import { format } from "date-fns";

const outcomeVariants: Record<
  RepairOutcome,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  pending: "warning",
  fixed: "success",
  beyond_repair: "destructive",
};

export function RepairList({
  initialRepairs,
}: {
  initialRepairs: RepairRecord[];
}) {
  const [repairs, setRepairs] = useState(initialRepairs);
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newSearch: string, newOutcome: string) => {
    startTransition(async () => {
      const filters: { outcome?: RepairOutcome; search?: string } = {};
      if (newOutcome !== "all") filters.outcome = newOutcome as RepairOutcome;
      if (newSearch) filters.search = newSearch;

      const filtered = await getRepairsWithTechnician(filters);
      setRepairs(filtered);
    });
  };

  const columns = [
    {
      key: "ticketNumber",
      header: "Ticket #",
      cell: (repair: RepairRecord) => (
        <span className="font-mono text-sm font-medium">
          {repair.ticketNumber}
        </span>
      ),
    },
    {
      key: "item",
      header: "Item",
      cell: (repair: RepairRecord) => (
        <div>
          <p className="font-medium">{repair.itemName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {repair.itemBarcode}
          </p>
        </div>
      ),
    },
    {
      key: "technician",
      header: "Technician",
      cell: (repair: RepairRecord) => (repair as any).technician?.name || "-",
      className: "hidden md:table-cell",
    },
    {
      key: "receivedAt",
      header: "Received",
      cell: (repair: RepairRecord) => (
        <span className="text-sm">
          {format(new Date(repair.receivedAt), "MMM d, yyyy")}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "outcome",
      header: "Outcome",
      cell: (repair: RepairRecord) => (
        <StatusBadge variant={outcomeVariants[repair.outcome]}>
          {repair.outcome.replace("_", " ")}
        </StatusBadge>
      ),
    },
    {
      key: "returned",
      header: "Returned",
      cell: (repair: RepairRecord) =>
        repair.outcome !== "pending" ? (
          <StatusBadge variant={repair.returnedToUser ? "success" : "warning"}>
            {repair.returnedToUser ? "Yes" : "No"}
          </StatusBadge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      className: "hidden md:table-cell",
    },
    {
      key: "actions",
      header: "",
      cell: (repair: RepairRecord) => (
        <Link href={`/repairs/${repair._id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={outcomeFilter}
          onValueChange={(value) => {
            setOutcomeFilter(value);
            handleFilterChange(search, value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={repairs}
        columns={columns}
        searchPlaceholder="Search by ticket number, item, or technician..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          handleFilterChange(value, outcomeFilter);
        }}
        emptyMessage={isPending ? "Loading..." : "No repair records found"}
      />
    </div>
  );
}
