"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TicketWithDepartmentSerialized } from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface OpenTicketsReportProps {
  tickets: TicketWithDepartmentSerialized[];
}

export function OpenTicketsReport({ tickets }: OpenTicketsReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Ticket #",
        "Title",
        "Category",
        "Priority",
        "Status",
        "Assigned To",
        "Created At",
        "Department",
      ].join(","),
      ...tickets.map((ticket) =>
        [
          ticket.ticketNumber,
          ticket.title,
          ticket.category || "N/A",
          ticket.priority,
          ticket.status,
          ticket.assignedUser?.email || "Unassigned",
          format(new Date(ticket.createdAt), "yyyy-MM-dd"),
          ticket.reportedBy.department?.name || "N/A",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `open-tickets-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const groupedByPriority = tickets.reduce(
    (acc, ticket) => {
      const priority = ticket.priority;
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(ticket);
      return acc;
    },
    {} as Record<string, TicketWithDepartmentSerialized[]>,
  );

  const criticalCount = groupedByPriority.critical?.length || 0;
  const highCount = groupedByPriority.high?.length || 0;
  const mediumCount = groupedByPriority.medium?.length || 0;
  const lowCount = groupedByPriority.low?.length || 0;

  const columns = [
    {
      key: "ticketNumber",
      header: "Ticket #",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <Link
          href={`/tickets/${ticket._id}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {ticket.ticketNumber}
        </Link>
      ),
    },
    {
      key: "title",
      header: "Title",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <div>
          <p className="font-medium">{ticket.title}</p>
          {ticket.category && (
            <p className="text-xs text-muted-foreground">{ticket.category}</p>
          )}
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <StatusBadge
          variant={
            ticket.priority === "critical"
              ? "destructive"
              : ticket.priority === "high"
                ? "warning"
                : ticket.priority === "medium"
                  ? "info"
                  : "secondary"
          }
        >
          {ticket.priority}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <StatusBadge
          variant={
            ticket.status === "open"
              ? "warning"
              : ticket.status === "in_progress"
                ? "info"
                : "secondary"
          }
        >
          {ticket.status.replace(/_/g, " ")}
        </StatusBadge>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <span className="text-sm">
          {ticket.assignedUser?.email || (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <span className="text-sm">
          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {criticalCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {highCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Medium Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediumCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Open Tickets ({tickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={tickets}
            columns={columns}
            searchPlaceholder="Search tickets..."
            emptyMessage="No open tickets found"
          />
        </CardContent>
      </Card>

      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
