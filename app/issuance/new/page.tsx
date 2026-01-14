import { MainLayout } from "@/components/layout/main-layout"
import { PageHeader } from "@/components/ui/page-header"
import { IssueItemForm } from "@/components/issuance/issue-item-form"
import { getInventoryItems } from "@/lib/actions/inventory"
import { getEmployees, getDepartments } from "@/lib/actions/employees"

export default async function NewIssuancePage() {
  const [items, employees, departments] = await Promise.all([
    getInventoryItems({ status: "in_stock" }),
    getEmployees(),
    getDepartments(),
  ])

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader title="Issue Item" description="Issue an IT asset to an employee or department" />

        <IssueItemForm availableItems={items} employees={employees} departments={departments} />
      </div>
    </MainLayout>
  )
}
