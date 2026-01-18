import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { InventoryList } from "@/components/inventory/inventory-list";
import { getInventoryItems } from "@/lib/actions/inventory";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";

export default async function InventoryPage() {
  const items = await getInventoryItems();
  const userResult = await getUserProfile();
  const canCreate =
    userResult.success &&
    userResult.user &&
    hasPermission(userResult.user.role as any, "inventory", "create");

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Inventory"
          description="Manage your IT assets and equipment"
          actions={
            canCreate ? (
              <Link href="/inventory/receive">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Receive Item
                </Button>
              </Link>
            ) : undefined
          }
        />

        <InventoryList
          initialItems={items}
          userRole={
            userResult.success && userResult.user ? userResult.user.role : null
          }
        />
      </div>
    </MainLayout>
  );
}
