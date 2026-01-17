import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ItemsByStatusReport } from "@/components/reports/items-by-status-report";
import { getInventoryItems } from "@/lib/actions/inventory";

export default async function ItemsByStatusPage() {
  const items = await getInventoryItems({});

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Items by Status Report"
          description="Detailed breakdown of items grouped by current status"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <ItemsByStatusReport items={items} />
      </div>
    </MainLayout>
  );
}
