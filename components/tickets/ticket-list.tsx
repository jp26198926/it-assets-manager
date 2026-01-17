"use client";

import { useState, useTransition } from "react";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/models/types";
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
import { getTicketsWithDepartment } from "@/lib/actions/tickets";
import { format } from "date-fns";

const statusVariants: Record<
  TicketStatus,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  open: "destructive",
  in_progress: "warning",
  waiting_parts: "info",
  resolved: "success",
  closed: "secondary",
  defective_closed: "destructive",
};

const priorityVariants: Record<
  TicketPriority,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  critical: "destructive",
};

export function TicketList({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (
    newSearch: string,
    newStatus: string,
    newPriority: string,
  ) => {
    startTransition(async () => {
      const filters: {
        status?: TicketStatus;
        priority?: TicketPriority;
        search?: string;
      } = {};
      if (newStatus !== "all") filters.status = newStatus as TicketStatus;
      if (newPriority !== "all")
        filters.priority = newPriority as TicketPriority;
      if (newSearch) filters.search = newSearch;

      const filtered = await getTicketsWithDepartment(filters);
      setTickets(filtered);
    });
  };

  const columns = [
    {
      key: "ticketNumber",
      header: "Ticket #",
      cell: (ticket: Ticket) => (
        <span className="font-mono text-sm font-medium">
          {ticket.ticketNumber}
        </span>
      ),
    },
    {
      key: "title",
      header: "Title",
      cell: (ticket: Ticket) => (
        <div className="max-w-[300px]">
          <p className="font-medium truncate">{ticket.title}</p>
          <p className="text-xs text-muted-foreground">{ticket.category}</p>
        </div>
      ),
    },
    {
      key: "reportedBy",
      header: "Reporter",
      cell: (ticket: Ticket) => (
        <div>
          <p className="text-sm">{ticket.reportedBy.name}</p>
          <p className="text-xs text-muted-foreground">
            {(ticket.reportedBy as any).department?.name || "-"}
          </p>
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "priority",
      header: "Priority",
      cell: (ticket: Ticket) => (
        <StatusBadge variant={priorityVariants[ticket.priority]}>
          {ticket.priority}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (ticket: Ticket) => (
        <StatusBadge variant={statusVariants[ticket.status]}>
          {ticket.status.replace("_", " ")}
        </StatusBadge>
      ),
    },
    {
      key: "item",
      header: "Item",
      cell: (ticket: Ticket) =>
        ticket.itemBarcode ? (
          <span className="font-mono text-xs text-muted-foreground">
            {ticket.itemBarcode}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      className: "hidden lg:table-cell",
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (ticket: Ticket) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "",
      cell: (ticket: Ticket) => (
        <Link href={`/tickets/${ticket._id}`}>
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
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            handleFilterChange(search, value, priorityFilter);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_parts">Waiting Parts</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value);
            handleFilterChange(search, statusFilter, value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={tickets}
        columns={columns}
        searchPlaceholder="Search by ticket number, title, or reporter..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          handleFilterChange(value, statusFilter, priorityFilter);
        }}
        emptyMessage={isPending ? "Loading..." : "No tickets found"}
      />
    </div>
  );
}
