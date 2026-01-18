import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsList } from "@/components/reports/reports-list";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const userResult = await getUserProfile();

  if (
    !userResult.success ||
    !userResult.data ||
    !hasPermission(userResult.data.role, "reports", "read")
  ) {
    redirect("/");
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Reports"
          description="Generate and view reports for inventory, issuances, and tickets"
        />

        <ReportsList />
      </div>
    </MainLayout>
  );
}
