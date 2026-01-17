"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TicketWithDepartmentSerialized } from "@/lib/models/types";
import { Download, Printer, UserCog } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface TicketsByTechnicianReportProps {
  tickets: TicketWithDepartmentSerialized[];
}

export function TicketsByTechnicianReport({
  tickets,
}: TicketsByTechnicianReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Technician",
        "Total Assigned",
        "Open",
        "In Progress",
        "Resolved",
        "Resolution Rate",
      ].join(","),
      ...Object.entries(groupedByTechnician).map(([technician, data]) =>
        [
          technician,
          data.tickets.length,
          data.open,
          data.inProgress,
          data.resolved,
          `${data.resolutionRate}%`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-by-technician-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const groupedByTechnician = tickets.reduce(
    (acc, ticket) => {
      const technician = ticket.assignedUser?.email || "Unassigned";
      if (!acc[technician]) {
        acc[technician] = {
          tickets: [],
          open: 0,
          inProgress: 0,
          resolved: 0,
          resolutionRate: 0,
        };
      }
      acc[technician].tickets.push(ticket);

      if (ticket.status === "open") acc[technician].open++;
      else if (ticket.status === "in_progress") acc[technician].inProgress++;
      else if (ticket.status === "resolved" || ticket.status === "closed")
        acc[technician].resolved++;

      return acc;
    },
    {} as Record<
      string,
      {
        tickets: TicketWithDepartmentSerialized[];
        open: number;
        inProgress: number;
        resolved: number;
        resolutionRate: number;
      }
    >,
  );

  // Calculate resolution rates
  Object.keys(groupedByTechnician).forEach((technician) => {
    const data = groupedByTechnician[technician];
    const total = data.tickets.length;
    data.resolutionRate =
      total > 0 ? Math.round((data.resolved / total) * 100) : 0;
  });

  const technicians = Object.entries(groupedByTechnician).sort(
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
        {technicians.slice(0, 6).map(([technician, data]) => (
          <Card key={technician}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="truncate">{technician}</span>
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
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">
                    Resolution Rate:
                  </span>
                  <span className="font-bold">{data.resolutionRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {technicians.map(([technician, data]) => (
          <Card key={technician}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                {technician} ({data.tickets.length})
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  Resolution Rate:{" "}
                  <span className="font-bold">{data.resolutionRate}%</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={data.tickets}
                columns={columns}
                searchPlaceholder={`Search ${technician}'s tickets...`}
                emptyMessage={`No tickets assigned to ${technician}`}
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
