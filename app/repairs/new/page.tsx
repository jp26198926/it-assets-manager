import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { StartRepairForm } from "@/components/repairs/start-repair-form";
import { getTicketsWithDepartment } from "@/lib/actions/tickets";
import { getInventoryItems } from "@/lib/actions/inventory";

interface PageProps {
  searchParams: Promise<{ ticketId?: string; itemBarcode?: string }>;
}

export default async function NewRepairPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [tickets, items] = await Promise.all([
    getTicketsWithDepartment({ status: "open" }),
    getInventoryItems(),
  ]);

  // Also get in-progress tickets
  const inProgressTickets = await getTicketsWithDepartment({
    status: "in_progress",
  });
  const allOpenTickets = [...tickets, ...inProgressTickets];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Start Repair"
          description="Receive an IT item for repair and create a repair record"
        />

        <StartRepairForm
          tickets={allOpenTickets}
          items={items}
          preselectedTicketId={params.ticketId}
          preselectedBarcode={params.itemBarcode}
        />
      </div>
    </MainLayout>
  );
}
