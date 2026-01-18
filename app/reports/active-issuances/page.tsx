import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ActiveIssuancesReport } from "@/components/reports/active-issuances-report";
import { getIssuances } from "@/lib/actions/issuance";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";
import { redirect } from "next/navigation";

export default async function ActiveIssuancesPage() {
  const userResult = await getUserProfile();

  if (
    !userResult.success ||
    !userResult.data ||
    !hasPermission(userResult.data.role, "reports", "read")
  ) {
    redirect("/");
  }

  const issuances = await getIssuances({ status: "active" });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Active Issuances Report"
          description="All items currently issued to employees or departments"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <ActiveIssuancesReport issuances={issuances} />
      </div>
    </MainLayout>
  );
}
