import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { IssuanceHistoryReport } from "@/components/reports/issuance-history-report";
import { getIssuances } from "@/lib/actions/issuance";

export default async function IssuanceHistoryPage() {
  const issuances = await getIssuances({});

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Issuance History Report"
          description="Complete history of all issuances and returns"
          actions={
            <Link href="/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
          }
        />

        <IssuanceHistoryReport issuances={issuances} />
      </div>
    </MainLayout>
  );
}
