import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";
import { TicketList } from "@/components/tickets/ticket-list";

export default async function TicketsPage() {
  const tickets = await getTicketsWithDepartment();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Tickets"
          description="Manage IT support tickets and requests"
          actions={
            <Link href="/tickets/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </Link>
          }
        />

        <TicketList initialTickets={tickets} />
      </div>
    </MainLayout>
  );
}
