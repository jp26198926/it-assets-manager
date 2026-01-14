import { MainLayout } from "@/components/layout/main-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { InventoryList } from "@/components/inventory/inventory-list"
import { getInventoryItems } from "@/lib/actions/inventory"

export default async function InventoryPage() {
  const items = await getInventoryItems()

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Inventory"
          description="Manage your IT assets and equipment"
          actions={
            <Link href="/inventory/receive">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Receive Item
              </Button>
            </Link>
          }
        />

        <InventoryList initialItems={items} />
      </div>
    </MainLayout>
  )
}
