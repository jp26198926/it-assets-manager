"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TicketWithDepartmentSerialized } from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface DailyTicketsReportProps {
  tickets: TicketWithDepartmentSerialized[];
}

export function DailyTicketsReport({ tickets }: DailyTicketsReportProps) {
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
        "Created Time",
      ].join(","),
      ...tickets.map((ticket) =>
        [
          ticket.ticketNumber,
          ticket.title,
          ticket.category || "N/A",
          ticket.priority,
          ticket.status,
          ticket.assignedUser?.email || "Unassigned",
          format(new Date(ticket.createdAt), "HH:mm:ss"),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-tickets-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const resolvedToday = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;
  const openToday = tickets.filter(
    (t) =>
      t.status === "open" ||
      t.status === "in_progress" ||
      t.status === "waiting_parts",
  ).length;

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
                : ticket.status === "resolved" || ticket.status === "closed"
                  ? "success"
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
      header: "Created Time",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <span className="text-sm font-mono">
          {format(new Date(ticket.createdAt), "HH:mm:ss")}
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
              Created Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "MMMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedToday}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Still Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {openToday}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <DataTable
              data={tickets}
              columns={columns}
              searchPlaceholder="Search today's tickets..."
              emptyMessage="No tickets created today"
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tickets created today</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
