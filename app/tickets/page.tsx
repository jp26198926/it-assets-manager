import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";
import { TicketList } from "@/components/tickets/ticket-list";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";
import { redirect } from "next/navigation";

export default async function TicketsPage() {
  const userResult = await getUserProfile();

  if (
    !userResult.success ||
    !userResult.data ||
    !hasPermission(userResult.data.role, "tickets", "read")
  ) {
    redirect("/");
  }

  // Default to active tickets only (exclude closed and defective_closed)
  const tickets = await getTicketsWithDepartment({ activeOnly: true });
  const canCreate = hasPermission(userResult.data.role, "tickets", "create");

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Tickets"
          description="Manage IT support tickets and requests"
          actions={
            canCreate ? (
              <Link href="/tickets/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </Link>
            ) : undefined
          }
        />

        <TicketList initialTickets={tickets} userRole={userResult.data.role} />
      </div>
    </MainLayout>
  );
}
