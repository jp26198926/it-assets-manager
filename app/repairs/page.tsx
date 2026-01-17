import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getRepairsWithTechnician } from "@/lib/actions/repairs";
import { RepairList } from "@/components/repairs/repair-list";

export default async function RepairsPage() {
  const repairs = await getRepairsWithTechnician();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Repairs"
          description="Manage IT equipment repairs and track outcomes"
          actions={
            <Link href="/repairs/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Repair
              </Button>
            </Link>
          }
        />

        <RepairList initialRepairs={repairs} />
      </div>
    </MainLayout>
  );
}
