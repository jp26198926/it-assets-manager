import { hasPermission, type UserRole } from "@/lib/models/User";
import { getCurrentUser } from "@/lib/actions/auth";

export async function checkPermission(
  resource: string,
  action: string,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  return hasPermission(user.role, resource, action);
}

export async function requirePermission(
  resource: string,
  action: string,
): Promise<void> {
  const hasAccess = await checkPermission(resource, action);
  if (!hasAccess) {
    throw new Error(
      `Forbidden: You don't have permission to ${action} ${resource}`,
    );
  }
}

export function canAccess(
  userRole: UserRole,
  resource: string,
  action: string,
): boolean {
  return hasPermission(userRole, resource, action);
}

// Client-side permission check hook data
export function getPermissionsForRole(role: UserRole) {
  return {
    canCreateInventory: hasPermission(role, "inventory", "create"),
    canUpdateInventory: hasPermission(role, "inventory", "update"),
    canDeleteInventory: hasPermission(role, "inventory", "delete"),
    canCreateTicket: hasPermission(role, "tickets", "create"),
    canUpdateTicket: hasPermission(role, "tickets", "update"),
    canDeleteTicket: hasPermission(role, "tickets", "delete"),
    canManageUsers: hasPermission(role, "users", "create"),
    canManageIssuance: hasPermission(role, "issuance", "create"),
    canViewReports: hasPermission(role, "reports", "read"),
  };
}
