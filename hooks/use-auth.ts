"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/actions/auth";
import { getPermissionsForRole } from "@/lib/utils/rbac";
import type { UserRole } from "@/lib/models/User";

export function useAuth() {
  const [user, setUser] = useState<{
    id: string;
    username: string;
    email: string;
    role: UserRole;
    name: string;
  } | null>(null);
  const [permissions, setPermissions] = useState<ReturnType<
    typeof getPermissionsForRole
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setPermissions(getPermissionsForRole(currentUser.role));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, permissions, loading };
}
