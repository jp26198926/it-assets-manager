import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsList } from "@/components/reports/reports-list";

export default function ReportsPage() {
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
