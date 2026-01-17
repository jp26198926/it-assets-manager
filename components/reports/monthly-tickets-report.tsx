"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TicketWithDepartmentSerialized } from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import Link from "next/link";

interface MonthlyTicketsReportProps {
  tickets: TicketWithDepartmentSerialized[];
}

export function MonthlyTicketsReport({ tickets }: MonthlyTicketsReportProps) {
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
        "Created Date",
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
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-tickets-${format(new Date(), "yyyy-MM")}.csv`;
    a.click();
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Weekly breakdown
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });
  const weeklyData = weeks.map((week) => {
    const weekStart = startOfWeek(week);
    const weekEnd = endOfWeek(week);

    const count = tickets.filter((ticket) => {
      const createdDate = new Date(ticket.createdAt);
      return createdDate >= weekStart && createdDate <= weekEnd;
    }).length;

    return {
      week: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
      count,
    };
  });

  const resolvedCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;
  const openCount = tickets.filter(
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(now, "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedCount}
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
              {openCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyData.map((week, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-2 last:border-0"
              >
                <span className="text-sm font-medium">{week.week}</span>
                <span className="text-sm font-bold">{week.count} tickets</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Monthly Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <DataTable
              data={tickets}
              columns={columns}
              searchPlaceholder="Search monthly tickets..."
              emptyMessage="No tickets created this month"
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No tickets created this month
              </p>
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
