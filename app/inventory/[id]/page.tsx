import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getInventoryItemById } from "@/lib/actions/inventory";
import { getIssuancesByItem } from "@/lib/actions/issuance";
import { getTicketsByItemId } from "@/lib/actions/tickets";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ItemDetails } from "@/components/inventory/item-details";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, issuances, tickets] = await Promise.all([
    getInventoryItemById(id),
    getIssuancesByItem(id),
    getTicketsByItemId(id),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title={item.name}
          description={`Barcode: ${item.barcode}`}
          actions={
            <Link href="/inventory">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inventory
              </Button>
            </Link>
          }
        />

        <ItemDetails item={item} issuances={issuances} tickets={tickets} />
      </div>
    </MainLayout>
  );
}
