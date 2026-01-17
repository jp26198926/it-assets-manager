import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InventorySummaryReport } from "@/components/reports/inventory-summary-report";
import { getInventoryItems } from "@/lib/actions/inventory";

export default async function InventorySummaryPage() {
  const items = await getInventoryItems({});

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Inventory Summary Report"
          description="Overview of all inventory items by status and category"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <InventorySummaryReport items={items} />
      </div>
    </MainLayout>
  );
}
