import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { CreateTicketForm } from "@/components/tickets/create-ticket-form";
import { getInventoryItems } from "@/lib/actions/inventory";
import { getCurrentUser } from "@/lib/actions/auth";

export default async function NewTicketPage() {
  const items = await getInventoryItems();
  const user = await getCurrentUser();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Create Ticket"
          description="Submit a new IT support request"
        />

        <CreateTicketForm availableItems={items} currentUser={user} />
      </div>
    </MainLayout>
  );
}
