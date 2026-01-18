import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getTicketWithDepartment } from "@/lib/actions/tickets";
import { getCurrentUser } from "@/lib/actions/auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TicketDetails } from "@/components/tickets/ticket-details";
import { TicketComments } from "@/components/tickets/ticket-comments";
import { hasPermission } from "@/lib/models/User";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, user] = await Promise.all([
    getTicketWithDepartment(id),
    getCurrentUser(),
  ]);

  if (!ticket) {
    notFound();
  }

  if (!user || !hasPermission(user.role, "tickets", "read")) {
    redirect("/");
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title={ticket.ticketNumber}
          description={ticket.title}
          actions={
            <Link href="/tickets">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
              </Button>
            </Link>
          }
        />

        <TicketDetails ticket={ticket} currentUser={user} />
      </div>
    </MainLayout>
  );
}
