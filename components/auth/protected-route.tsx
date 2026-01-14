"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/models/User";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  resource?: string;
  action?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  resource,
  action,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          router.push("/login");
          return;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);
        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert
          variant="destructive"
          className="max-w-md glass-strong neo-raised"
        >
          <h3 className="font-semibold">Access Denied</h3>
          <p className="text-sm mt-2">
            You don't have permission to access this page.
          </p>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
