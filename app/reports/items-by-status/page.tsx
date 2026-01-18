import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ItemsByStatusReport } from "@/components/reports/items-by-status-report";
import { getInventoryItems } from "@/lib/actions/inventory";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";
import { redirect } from "next/navigation";

export default async function ItemsByStatusPage() {
  const userResult = await getUserProfile();

  if (
    !userResult.success ||
    !userResult.data ||
    !hasPermission(userResult.data.role, "reports", "read")
  ) {
    redirect("/");
  }

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
