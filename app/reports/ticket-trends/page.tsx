import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TicketTrendsReport } from "@/components/reports/ticket-trends-report";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";

export default async function TicketTrendsPage() {
  const tickets = await getTicketsWithDepartment();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Ticket Trends Report"
          description="Ticket trends and statistics over time"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <TicketTrendsReport tickets={tickets} />
      </div>
    </MainLayout>
  );
}
