import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TicketsByCategoryReport } from "@/components/reports/tickets-by-category-report";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";

export default async function TicketsByCategoryPage() {
  const tickets = await getTicketsWithDepartment();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Tickets by Category Report"
          description="Tickets grouped by category"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <TicketsByCategoryReport tickets={tickets} />
      </div>
    </MainLayout>
  );
}
