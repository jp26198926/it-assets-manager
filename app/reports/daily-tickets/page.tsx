import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DailyTicketsReport } from "@/components/reports/daily-tickets-report";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";
import { startOfDay, endOfDay } from "date-fns";

export default async function DailyTicketsPage() {
  const allTickets = await getTicketsWithDepartment();
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const todayTickets = allTickets.filter((ticket) => {
    const createdDate = new Date(ticket.createdAt);
    return createdDate >= startOfToday && createdDate <= endOfToday;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Daily Tickets Report"
          description="Tickets created today"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <DailyTicketsReport tickets={todayTickets} />
      </div>
    </MainLayout>
  );
}
