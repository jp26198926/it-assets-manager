import { MainLayout } from "@/components/layout/main-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { getRepairById } from "@/lib/actions/repairs"
import { getTicketById } from "@/lib/actions/tickets"
import { getInventoryItemById } from "@/lib/actions/inventory"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RepairDetails } from "@/components/repairs/repair-details"

export default async function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repair = await getRepairById(id)

  if (!repair) {
    notFound()
  }

  const [ticket, item] = await Promise.all([
    getTicketById(repair.ticketId.toString()),
    getInventoryItemById(repair.itemId.toString()),
  ])

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title={`Repair: ${repair.ticketNumber}`}
          description={repair.itemName}
          actions={
            <Link href="/repairs">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Repairs
              </Button>
            </Link>
          }
        />

        <RepairDetails repair={repair} ticket={ticket} item={item} />
      </div>
    </MainLayout>
  )
}
