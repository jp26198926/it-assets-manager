import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MonthlyTicketsReport } from "@/components/reports/monthly-tickets-report";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";
import { startOfMonth, endOfMonth } from "date-fns";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";
import { redirect } from "next/navigation";

export default async function MonthlyTicketsPage() {
  const userResult = await getUserProfile();

  if (
    !userResult.success ||
    !userResult.data ||
    !hasPermission(userResult.data.role, "reports", "read")
  ) {
    redirect("/");
  }

  const allTickets = await getTicketsWithDepartment();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyTickets = allTickets.filter((ticket) => {
    const createdDate = new Date(ticket.createdAt);
    return createdDate >= monthStart && createdDate <= monthEnd;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Monthly Tickets Report"
          description="Tickets created this month"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <MonthlyTicketsReport tickets={monthlyTickets} />
      </div>
    </MainLayout>
  );
}
