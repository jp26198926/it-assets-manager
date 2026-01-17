"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Package,
  ArrowRightLeft,
  Wrench,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Clock,
  Calendar,
  CalendarDays,
  FolderOpen,
  UserCog,
  FileBarChart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const reportTemplates = [
  {
    id: "inventory-summary",
    title: "Inventory Summary Report",
    description: "Overview of all inventory items by status and category",
    icon: Package,
    category: "Inventory",
    link: "/reports/inventory-summary",
  },
  {
    id: "items-by-status",
    title: "Items by Status",
    description: "Detailed breakdown of items grouped by current status",
    icon: BarChart3,
    category: "Inventory",
    link: "/reports/items-by-status",
  },
  {
    id: "items-under-repair",
    title: "Items Under Repair",
    description: "List of all items currently under repair or maintenance",
    icon: Wrench,
    category: "Inventory",
    link: "/reports/items-under-repair",
  },
  {
    id: "active-issuances",
    title: "Active Issuances Report",
    description: "All items currently issued to employees or departments",
    icon: ArrowRightLeft,
    category: "Issuance",
    link: "/reports/active-issuances",
  },
  {
    id: "overdue-returns",
    title: "Overdue Returns",
    description: "Items that have passed their expected return date",
    icon: AlertCircle,
    category: "Issuance",
    link: "/reports/overdue-returns",
  },
  {
    id: "issuance-history",
    title: "Issuance History",
    description: "Complete history of all issuances and returns",
    icon: Clock,
    category: "Issuance",
    link: "/reports/issuance-history",
  },
  {
    id: "open-tickets",
    title: "Open Tickets Report",
    description: "All unresolved tickets by priority and category",
    icon: FileText,
    category: "Tickets",
    link: "/reports/open-tickets",
  },
  {
    id: "ticket-trends",
    title: "Ticket Trends Analysis",
    description: "Ticket volume and resolution trends over time",
    icon: TrendingUp,
    category: "Tickets",
    link: "/reports/ticket-trends",
  },
  {
    id: "daily-tickets",
    title: "Daily Tickets Report",
    description: "Tickets created and resolved today",
    icon: Calendar,
    category: "Tickets",
    link: "/reports/daily-tickets",
  },
  {
    id: "monthly-tickets",
    title: "Monthly Tickets Report",
    description: "Comprehensive monthly ticket statistics",
    icon: CalendarDays,
    category: "Tickets",
    link: "/reports/monthly-tickets",
  },
  {
    id: "tickets-by-category",
    title: "Tickets by Category",
    description: "Ticket distribution across categories",
    icon: FolderOpen,
    category: "Tickets",
    link: "/reports/tickets-by-category",
  },
  {
    id: "tickets-by-technician",
    title: "Tickets by Technician",
    description: "Workload and performance by assigned technician",
    icon: UserCog,
    category: "Tickets",
    link: "/reports/tickets-by-technician",
  },
];

const categories = ["Inventory", "Issuance", "Tickets"];

export function ReportsList() {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState("");

  const handleReportChange = (value: string) => {
    setSelectedReport(value);
    const report = reportTemplates.find((r) => r.id === value);
    if (report) {
      router.push(report.link);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <FileBarChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Select Report</CardTitle>
              <CardDescription>
                Choose a report to generate and view detailed analytics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedReport} onValueChange={handleReportChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a report type..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => {
                const categoryReports = reportTemplates.filter(
                  (report) => report.category === category,
                );
                return (
                  <SelectGroup key={category}>
                    <SelectLabel>{category} Reports</SelectLabel>
                    {categoryReports.map((report) => {
                      const Icon = report.icon;
                      return (
                        <SelectItem key={report.id} value={report.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{report.title}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>

          {selectedReport && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                {
                  reportTemplates.find((r) => r.id === selectedReport)
                    ?.description
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const categoryReports = reportTemplates.filter(
            (report) => report.category === category,
          );

          return categoryReports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleReportChange(report.id)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {report.title}
                      </CardTitle>
                      <CardDescription className="mt-1.5 text-sm">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          });
        })}
      </div>
    </div>
  );
}
