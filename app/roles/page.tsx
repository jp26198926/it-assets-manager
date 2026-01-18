import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getRoles } from "@/lib/actions/roles";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RoleList } from "@/components/roles/role-list";
import { AddRoleDialog } from "@/components/roles/add-role-dialog";
import { hasPermission } from "@/lib/models/User";

export default async function RolesPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.role, "users", "read")) {
    redirect("/");
  }

  const rolesResult = await getRoles();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Roles Management"
          description="Manage user roles and permissions"
        />

        <RoleList initialRoles={rolesResult.data || []} userRole={user.role} />
      </div>
    </MainLayout>
  );
}
