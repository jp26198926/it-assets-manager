import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getIssuances } from "@/lib/actions/issuance";
import { IssuanceList } from "@/components/issuance/issuance-list";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";

export default async function IssuancePage() {
  const issuances = await getIssuances();
  const userResult = await getUserProfile();
  const canCreate =
    userResult.success &&
    userResult.user &&
    hasPermission(userResult.user.role as any, "issuance", "create");

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Issuance"
          description="Track IT asset issuance to employees and departments"
          actions={
            canCreate ? (
              <Link href="/issuance/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Item
                </Button>
              </Link>
            ) : undefined
          }
        />

        <IssuanceList
          initialIssuances={issuances}
          userRole={
            userResult.success && userResult.user ? userResult.user.role : null
          }
        />
      </div>
    </MainLayout>
  );
}
