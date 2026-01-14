"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Ticket, RepairRecord, TicketStatus, TicketPriority } from "@/lib/models/types"
import { format } from "date-fns"
import { updateTicketStatus } from "@/lib/actions/tickets"
import { useRouter } from "next/navigation"
import { Loader2, Wrench } from "lucide-react"
import Link from "next/link"

const statusVariants: Record<TicketStatus, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  open: "destructive",
  in_progress: "warning",
  waiting_parts: "info",
  resolved: "success",
  closed: "secondary",
}

const priorityVariants: Record<TicketPriority, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  critical: "destructive",
}

interface TicketDetailsProps {
  ticket: Ticket
  repair: RepairRecord | null
}

export function TicketDetails({ ticket, repair }: TicketDetailsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status)
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo || "")

  const handleStatusUpdate = () => {
    startTransition(async () => {
      const result = await updateTicketStatus(ticket._id!.toString(), newStatus, assignedTo || undefined)
      if (result.success) {
        router.refresh()
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Ticket Information
              <div className="flex gap-2">
                <StatusBadge variant={priorityVariants[ticket.priority]}>{ticket.priority}</StatusBadge>
                <StatusBadge variant={statusVariants[ticket.status]}>{ticket.status.replace("_", " ")}</StatusBadge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{ticket.category}</p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm text-muted-foreground mb-2">Description</h4>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.itemBarcode && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm text-muted-foreground mb-2">Related Item</h4>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="font-medium">{ticket.itemName}</p>
                    <p className="text-sm text-muted-foreground font-mono">{ticket.itemBarcode}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reporter</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="font-medium">{ticket.reportedBy.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{ticket.reportedBy.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Department</dt>
                <dd className="font-medium">{ticket.reportedBy.department || "-"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {repair && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Repair Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Technician</dt>
                  <dd className="font-medium">{repair.technicianName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Outcome</dt>
                  <dd>
                    <StatusBadge
                      variant={
                        repair.outcome === "pending"
                          ? "warning"
                          : repair.outcome === "fixed"
                            ? "success"
                            : "destructive"
                      }
                    >
                      {repair.outcome}
                    </StatusBadge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Received</dt>
                  <dd className="font-medium">{format(new Date(repair.receivedAt), "MMM d, yyyy 'at' h:mm a")}</dd>
                </div>
                {repair.completedAt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Completed</dt>
                    <dd className="font-medium">{format(new Date(repair.completedAt), "MMM d, yyyy 'at' h:mm a")}</dd>
                  </div>
                )}
              </dl>
              {repair.diagnosis && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-sm text-muted-foreground mb-1">Diagnosis</dt>
                  <dd>{repair.diagnosis}</dd>
                </div>
              )}
              {repair.actionsTaken && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-sm text-muted-foreground mb-1">Actions Taken</dt>
                  <dd>{repair.actionsTaken}</dd>
                </div>
              )}
              <div className="mt-4">
                <Link href={`/repairs/${repair._id}`}>
                  <Button variant="outline" size="sm">
                    View Full Repair Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as TicketStatus)}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_parts">Waiting Parts</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Technician name"
                className="bg-secondary"
              />
            </div>

            <Button onClick={handleStatusUpdate} disabled={isPending} className="w-full">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </CardContent>
        </Card>

        {ticket.itemBarcode && !repair && ticket.status !== "closed" && ticket.status !== "resolved" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/repairs/new?ticketId=${ticket._id}&itemBarcode=${ticket.itemBarcode}`}>
                <Button className="w-full">
                  <Wrench className="h-4 w-4 mr-2" />
                  Start Repair Process
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              {ticket.assignedTo && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-info" />
                  <div>
                    <p className="text-sm font-medium">Assigned to {ticket.assignedTo}</p>
                  </div>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-success" />
                  <div>
                    <p className="text-sm font-medium">Resolved</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}
              {ticket.closedAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Closed</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.closedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
