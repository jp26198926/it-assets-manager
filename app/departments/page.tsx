import { MainLayout } from "@/components/layout/main-layout";
import { getDepartments } from "@/lib/actions/employees";
import { DepartmentsPageContent } from "@/components/departments/departments-page-content";

export default async function DepartmentsPage() {
  const result = await getDepartments();
  const departments = result.success && result.data ? result.data : [];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <DepartmentsPageContent initialDepartments={departments} />
      </div>
    </MainLayout>
  );
}
