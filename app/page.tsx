import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { getInventoryStats } from "@/lib/actions/inventory";
import { getTicketStats } from "@/lib/actions/tickets";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  Package,
  PackageCheck,
  PackageX,
  Wrench,
  Ticket,
  TicketCheck,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default async function DashboardPage() {
  const [inventoryStats, ticketStats, user] = await Promise.all([
    getInventoryStats(),
    getTicketStats(),
    getCurrentUser(),
  ]);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title={`Welcome back, ${user?.name || "User"}!`}
            description="Overview of your IT asset management system"
          />
          {user && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <Badge variant="default" className="neo-flat">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          )}
        </div>

        {/* Inventory Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Inventory Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Items"
              value={inventoryStats.total}
              icon={Package}
              description="All registered items"
            />
            <StatCard
              title="In Stock"
              value={inventoryStats.inStock}
              icon={PackageCheck}
              description="Available for issuance"
            />
            <StatCard
              title="Issued"
              value={inventoryStats.issued}
              icon={PackageX}
              description="Currently in use"
            />
            <StatCard
              title="Under Repair"
              value={inventoryStats.underRepair}
              icon={Wrench}
              description="Being repaired"
            />
          </div>
        </div>

        {/* Ticket Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Ticket Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Tickets"
              value={ticketStats.total}
              icon={Ticket}
              description="All time tickets"
            />
            <StatCard
              title="Open"
              value={ticketStats.open}
              icon={AlertCircle}
              description="Awaiting action"
            />
            <StatCard
              title="In Progress"
              value={ticketStats.inProgress}
              icon={Wrench}
              description="Being worked on"
            />
            <StatCard
              title="Resolved"
              value={ticketStats.resolved}
              icon={CheckCircle2}
              description="Completed tickets"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCharts
            inventoryStats={inventoryStats}
            ticketStats={ticketStats}
          />
          <RecentActivity />
        </div>
      </div>
    </MainLayout>
  );
}
