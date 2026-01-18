import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OpenTicketsReport } from "@/components/reports/open-tickets-report";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";
import { redirect } from "next/navigation";

export default async function OpenTicketsPage() {
  const userResult = await getUserProfile();

  if (
    !userResult.success ||
    !userResult.data ||
    !hasPermission(userResult.data.role, "reports", "read")
  ) {
    redirect("/");
  }

  const allTickets = await getTicketsWithDepartment();
  const openTickets = allTickets.filter(
    (ticket) =>
      ticket.status === "open" ||
      ticket.status === "in_progress" ||
      ticket.status === "waiting_parts",
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Open Tickets Report"
          description="All currently open and in-progress tickets"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <OpenTicketsReport tickets={openTickets} />
      </div>
    </MainLayout>
  );
}
