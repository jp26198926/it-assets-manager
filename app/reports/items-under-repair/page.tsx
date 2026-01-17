import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ItemsUnderRepairReport } from "@/components/reports/items-under-repair-report";
import { getInventoryItems } from "@/lib/actions/inventory";

export default async function ItemsUnderRepairPage() {
  const items = await getInventoryItems({ status: "under_repair" });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Items Under Repair Report"
          description="List of all items currently under repair or maintenance"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <ItemsUnderRepairReport items={items} />
      </div>
    </MainLayout>
  );
}
