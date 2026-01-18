"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { trackGuestTicket } from "@/lib/actions/tickets";
import {
  Loader2,
  Search,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
import type { TicketStatus, TicketPriority } from "@/lib/models/types";

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

export function GuestTicketTracker() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticket, setTicket] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ticket number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await trackGuestTicket(ticketNumber.trim());

      if (result.success && result.ticket) {
        setTicket(result.ticket);
      } else {
        setTicket(null);
        toast({
          title: "Ticket Not Found",
          description: result.error || "No ticket found with this number",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="ticketNumber" className="sr-only">
            Ticket Number
          </Label>
          <Input
            id="ticketNumber"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            placeholder="Enter ticket number (e.g., TKT-2024-00001)"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Search</span>
        </Button>
      </form>

      {ticket && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{ticket.ticketNumber}</h3>
            <div className="flex gap-2">
              <StatusBadge
                variant={priorityVariants[ticket.priority as TicketPriority]}
              >
                {ticket.priority}
              </StatusBadge>
              <StatusBadge
                variant={statusVariants[ticket.status as TicketStatus]}
              >
                {ticket.status.replace("_", " ")}
              </StatusBadge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">{ticket.title}</h4>
            <div
              className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: ticket.description }}
            />
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({ticket.attachments.length})
              </h4>
              <div className="space-y-1">
                {ticket.attachments.map((attachment: any, index: number) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-background rounded hover:bg-muted/50 transition-colors text-sm"
                  >
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span className="truncate flex-1">
                      {attachment.filename}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({(attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 text-sm pt-4 border-t">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{ticket.category}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reporter:</span>
              <span className="font-medium">{ticket.reportedBy.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {format(new Date(ticket.createdAt), "MMM d, yyyy")}
              </span>
            </div>

            {ticket.resolvedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Resolved:</span>
                <span className="font-medium">
                  {format(new Date(ticket.resolvedAt), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>

          {ticket.comments && ticket.comments.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Updates ({ticket.comments.length})
              </h4>
              <div className="space-y-3">
                {ticket.comments.map((comment: any, index: number) => (
                  <div key={index} className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(comment.createdAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
