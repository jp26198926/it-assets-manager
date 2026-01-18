import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getUsers } from "@/lib/actions/users";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { UserList } from "@/components/users/user-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/lib/models/User";

export const metadata: Metadata = {
  title: "Users | IT Inventory",
  description: "Manage user accounts",
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  // Check permission to read users
  if (!currentUser || !hasPermission(currentUser.role, "users", "read")) {
    redirect("/");
  }

  const canCreate = hasPermission(currentUser.role, "users", "create");

  const result = await getUsers();
  const users = result.success && result.data ? result.data : [];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Users"
          description="Manage user accounts and permissions"
        />
        <UserList initialUsers={users} userRole={currentUser.role} />
      </div>
    </MainLayout>
  );
}
