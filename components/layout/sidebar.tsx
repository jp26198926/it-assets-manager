"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  ArrowRightLeft,
  Ticket,
  Menu,
  X,
  QrCode,
  FolderTree,
  FileText,
  BookOpen,
  Settings,
  Shield,
  UserCog,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "./user-menu";
import { getCurrentUser } from "@/lib/actions/auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { type: "separator" as const },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Knowledge Base", href: "/knowledgebase", icon: BookOpen },
  { type: "separator" as const },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Issuance", href: "/issuance", icon: ArrowRightLeft },
  { type: "separator" as const },
  { name: "Reports", href: "/reports", icon: FileText },
  { type: "separator" as const },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { type: "separator" as const },
  { name: "Roles", href: "/roles", icon: Shield, adminOnly: true },
  { name: "Users", href: "/users", icon: UserCog, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };
    fetchUser();
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-background border-b px-4 py-3 glass">
        <div className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-primary" />
          <span className="font-semibold">IT Asset Manager</span>
        </div>
        <div className="flex items-center gap-2">
          {user && <UserMenu user={user} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="neo-flat"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform lg:translate-x-0 neo-raised glass flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b px-6">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">IT Asset Manager</span>
          </div>
          <div className="hidden lg:block">
            {user && <UserMenu user={user} />}
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4 overflow-y-auto flex-1">
          {navigation.map((item, index) => {
            // Render separator
            if (item.type === "separator") {
              return <Separator key={`separator-${index}`} className="my-2" />;
            }

            const isActive = pathname === item.href;
            // Hide admin-only items for non-admin users
            if (item.adminOnly && user?.role !== "admin") {
              return null;
            }
            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-secondary text-foreground neo-pressed"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground glass-hover",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
