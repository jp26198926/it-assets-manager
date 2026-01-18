import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTickets } from "@/lib/actions/tickets";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserRole } from "@/lib/models/User";

interface RecentActivityProps {
  userRole: UserRole;
  userEmail: string;
  userId: string;
}

export async function RecentActivity({
  userRole,
  userEmail,
  userId,
}: RecentActivityProps) {
  const tickets = await getTickets();

  const recentTickets = tickets.slice(0, 5);

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Latest Tickets
          </h3>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket._id?.toString()}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {ticket.ticketNumber}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {ticket.title}
                    </p>
                  </div>
                  <StatusBadge
                    variant={
                      ticket.status === "open"
                        ? "destructive"
                        : ticket.status === "in_progress"
                          ? "warning"
                          : ticket.status === "resolved"
                            ? "success"
                            : "secondary"
                    }
                  >
                    {ticket.status.replace("_", " ")}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
