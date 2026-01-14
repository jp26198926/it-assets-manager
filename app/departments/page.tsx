import { MainLayout } from "@/components/layout/main-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getDepartments } from "@/lib/actions/employees"
import { DepartmentList } from "@/components/departments/department-list"
import { AddDepartmentDialog } from "@/components/departments/add-department-dialog"

export default async function DepartmentsPage() {
  const departments = await getDepartments()

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Departments"
          description="Manage departments for asset issuance"
          actions={
            <AddDepartmentDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </AddDepartmentDialog>
          }
        />

        <DepartmentList departments={departments} />
      </div>
    </MainLayout>
  )
}
