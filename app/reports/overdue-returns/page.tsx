import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OverdueReturnsReport } from "@/components/reports/overdue-returns-report";
import { getIssuances } from "@/lib/actions/issuance";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";
import { redirect } from "next/navigation";

export default async function OverdueReturnsPage() {
  const userResult = await getUserProfile();

  if (
    !userResult.success ||
    !userResult.data ||
    !hasPermission(userResult.data.role, "reports", "read")
  ) {
    redirect("/");
  }

  const allIssuances = await getIssuances({ status: "active" });

  // Filter overdue items
  const now = new Date();
  const overdueIssuances = allIssuances.filter((issuance) => {
    if (!issuance.expectedReturn) return false;
    return new Date(issuance.expectedReturn) < now;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Overdue Returns Report"
          description="Items that have passed their expected return date"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <OverdueReturnsReport issuances={overdueIssuances} />
      </div>
    </MainLayout>
  );
}
