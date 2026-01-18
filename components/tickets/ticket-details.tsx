"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/models/types";
import { format } from "date-fns";
import { updateTicketStatus } from "@/lib/actions/tickets";
import { getTechniciansAndAdmins } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";
import { Loader2, Download, FileIcon } from "lucide-react";
import { TicketComments } from "./ticket-comments";

const statusVariants: Record<
  TicketStatus,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  open: "destructive",
  in_progress: "warning",
  waiting_parts: "info",
  resolved: "success",
  closed: "secondary",
  defective_closed: "destructive",
};

const priorityVariants: Record<
  TicketPriority,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  low: "secondary",
  medium: "info",
  high: "warning",
  critical: "destructive",
};

interface TicketDetailsProps {
  ticket: Ticket;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function TicketDetails({ ticket, currentUser }: TicketDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status);
  const [assignedToId, setAssignedToId] = useState(
    (ticket as any).assignedToId || "",
  );
  const [users, setUsers] = useState<
    Array<{ _id: string; name: string; email: string; role: string }>
  >([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getTechniciansAndAdmins();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    };
    fetchUsers();
  }, []);

  const handleStatusUpdate = () => {
    startTransition(async () => {
      // Auto-change status to 'in_progress' if assigning to an open ticket
      let finalStatus = newStatus;
      if (assignedToId && assignedToId !== "none" && newStatus === "open") {
        finalStatus = "in_progress";
      }

      const result = await updateTicketStatus(
        ticket._id!.toString(),
        finalStatus,
        assignedToId || undefined,
      );
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Ticket Information
              <div className="flex gap-2">
                <StatusBadge variant={priorityVariants[ticket.priority]}>
                  {ticket.priority}
                </StatusBadge>
                <StatusBadge variant={statusVariants[ticket.status]}>
                  {ticket.status.replace("_", " ")}
                </StatusBadge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {ticket.category}
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm text-muted-foreground mb-2">
                  Description
                </h4>
                <div
                  className="tiptap prose max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                />
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    Attachments ({ticket.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        download={attachment.name}
                        className="flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileIcon className="h-5 w-5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {ticket.itemBarcode && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm text-muted-foreground mb-2">
                    Related Item
                  </h4>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="font-medium">{ticket.itemName}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {ticket.itemBarcode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <TicketComments
          ticketId={ticket._id!.toString()}
          comments={ticket.comments || []}
          currentUser={{
            _id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
          }}
          userRole={currentUser.role as any}
          reportedByEmail={ticket.reportedBy.email}
          assignedUserEmail={(ticket as any).assignedUser?.email}
          assignedToId={(ticket as any).assignedToId}
        />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as TicketStatus)}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_parts">Waiting Parts</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="defective_closed">
                    Defective - Closed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={isPending}
              className="w-full"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reporter</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
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
                <dd className="font-medium">
                  {(ticket.reportedBy as any).department?.name || "-"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

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
                    {format(
                      new Date(ticket.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>
              {(ticket as any).assignedUser && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-info" />
                  <div>
                    <p className="text-sm font-medium">
                      Assigned to {(ticket as any).assignedUser.name}
                    </p>
                  </div>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-success" />
                  <div>
                    <p className="text-sm font-medium">Resolved</p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(ticket.resolvedAt),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
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
                      {format(
                        new Date(ticket.closedAt),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
