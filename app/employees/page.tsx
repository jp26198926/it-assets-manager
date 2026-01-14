import { MainLayout } from "@/components/layout/main-layout";
import { getEmployees } from "@/lib/actions/employees";
import { EmployeesPageContent } from "@/components/employees/employees-page-content";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <MainLayout>
      <EmployeesPageContent initialEmployees={employees} />
    </MainLayout>
  );
}
