import { MainLayout } from "@/components/layout/main-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getIssuances } from "@/lib/actions/issuance"
import { IssuanceList } from "@/components/issuance/issuance-list"

export default async function IssuancePage() {
  const issuances = await getIssuances()

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Issuance"
          description="Track IT asset issuance to employees and departments"
          actions={
            <Link href="/issuance/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Issue Item
              </Button>
            </Link>
          }
        />

        <IssuanceList initialIssuances={issuances} />
      </div>
    </MainLayout>
  )
}
