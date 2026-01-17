"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TicketWithDepartmentSerialized } from "@/lib/models/types";
import { Download, Printer, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface TicketsByCategoryReportProps {
  tickets: TicketWithDepartmentSerialized[];
}

export function TicketsByCategoryReport({
  tickets,
}: TicketsByCategoryReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ["Category", "Total Tickets", "Open", "In Progress", "Resolved"].join(
        ",",
      ),
      ...Object.entries(groupedByCategory).map(([category, data]) =>
        [
          category,
          data.tickets.length,
          data.open,
          data.inProgress,
          data.resolved,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-by-category-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const groupedByCategory = tickets.reduce(
    (acc, ticket) => {
      const category = ticket.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = {
          tickets: [],
          open: 0,
          inProgress: 0,
          resolved: 0,
        };
      }
      acc[category].tickets.push(ticket);

      if (ticket.status === "open") acc[category].open++;
      else if (ticket.status === "in_progress") acc[category].inProgress++;
      else if (ticket.status === "resolved" || ticket.status === "closed")
        acc[category].resolved++;

      return acc;
    },
    {} as Record<
      string,
      {
        tickets: TicketWithDepartmentSerialized[];
        open: number;
        inProgress: number;
        resolved: number;
      }
    >,
  );

  const categories = Object.entries(groupedByCategory).sort(
    ([, a], [, b]) => b.tickets.length - a.tickets.length,
  );

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
        <p className="font-medium">{ticket.title}</p>
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
      key: "createdAt",
      header: "Created",
      cell: (ticket: TicketWithDepartmentSerialized) => (
        <span className="text-sm">
          {format(new Date(ticket.createdAt), "MMM d, yyyy")}
        </span>
      ),
      className: "hidden md:table-cell",
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.slice(0, 6).map(([category, data]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {data.tickets.length}
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open:</span>
                  <span className="font-medium text-orange-600">
                    {data.open}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Progress:</span>
                  <span className="font-medium text-blue-600">
                    {data.inProgress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved:</span>
                  <span className="font-medium text-green-600">
                    {data.resolved}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {categories.map(([category, data]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {category} ({data.tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={data.tickets}
                columns={columns}
                searchPlaceholder={`Search ${category} tickets...`}
                emptyMessage={`No tickets in ${category}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
