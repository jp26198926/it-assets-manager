"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TicketWithDepartmentSerialized } from "@/lib/models/types";
import { Download, Printer } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
} from "date-fns";

interface TicketTrendsReportProps {
  tickets: TicketWithDepartmentSerialized[];
}

export function TicketTrendsReport({ tickets }: TicketTrendsReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ["Month", "Created", "Resolved", "Open"].join(","),
      ...monthlyData.map((month) =>
        [month.month, month.created, month.resolved, month.open].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-trends-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Get last 6 months
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 5);
  const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

  const monthlyData = months.map((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const created = tickets.filter((ticket) => {
      const createdDate = new Date(ticket.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    }).length;

    const resolved = tickets.filter((ticket) => {
      if (!ticket.resolvedAt) return false;
      const resolvedDate = new Date(ticket.resolvedAt);
      return resolvedDate >= monthStart && resolvedDate <= monthEnd;
    }).length;

    const open = tickets.filter((ticket) => {
      const createdDate = new Date(ticket.createdAt);
      const isCreatedInMonth =
        createdDate >= monthStart && createdDate <= monthEnd;
      const isOpen =
        ticket.status === "open" ||
        ticket.status === "in_progress" ||
        ticket.status === "waiting_parts";
      return isCreatedInMonth && isOpen;
    }).length;

    return {
      month: format(month, "MMM yyyy"),
      created,
      resolved,
      open,
    };
  });

  const totalCreated = tickets.length;
  const totalResolved = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;
  const totalOpen = tickets.filter(
    (t) =>
      t.status === "open" ||
      t.status === "in_progress" ||
      t.status === "waiting_parts",
  ).length;
  const resolutionRate =
    totalCreated > 0 ? ((totalResolved / totalCreated) * 100).toFixed(1) : "0";

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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreated}</div>
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
              {totalResolved}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalOpen}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Monthly Trends (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{data.month}</h4>
                  <span className="text-sm text-muted-foreground">
                    {data.created} total
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 font-medium">{data.created}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resolved:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {data.resolved}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Open:</span>
                    <span className="ml-2 font-medium text-orange-600">
                      {data.open}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
