import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTickets } from "@/lib/actions/tickets"
import { getRepairs } from "@/lib/actions/repairs"
import { StatusBadge } from "@/components/ui/status-badge"

export async function RecentActivity() {
  const [tickets, repairs] = await Promise.all([getTickets(), getRepairs()])

  const recentTickets = tickets.slice(0, 5)
  const recentRepairs = repairs.slice(0, 5)

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Latest Tickets</h3>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket._id?.toString()} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{ticket.ticketNumber}</p>
                    <p className="text-muted-foreground truncate">{ticket.title}</p>
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

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Latest Repairs</h3>
          {recentRepairs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No repairs yet</p>
          ) : (
            <div className="space-y-3">
              {recentRepairs.map((repair) => (
                <div key={repair._id?.toString()} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{repair.ticketNumber}</p>
                    <p className="text-muted-foreground truncate">{repair.itemName}</p>
                  </div>
                  <StatusBadge
                    variant={
                      repair.outcome === "pending" ? "warning" : repair.outcome === "fixed" ? "success" : "destructive"
                    }
                  >
                    {repair.outcome}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
