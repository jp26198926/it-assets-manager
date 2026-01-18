"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { addCommentToTicket } from "@/lib/actions/tickets";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, MessageSquare, Send } from "lucide-react";
import type { TicketComment } from "@/lib/models/types";
import { useToast } from "@/hooks/use-toast";
import { hasPermission, UserRole } from "@/lib/models/User";

interface TicketCommentsProps {
  ticketId: string;
  comments: TicketComment[];
  currentUser: {
    _id: string;
    name: string;
    email: string;
  };
  userRole: UserRole;
  reportedByEmail: string;
  assignedUserEmail?: string;
  assignedToId?: string;
}

export function TicketComments({
  ticketId,
  comments,
  currentUser,
  userRole,
  reportedByEmail,
  assignedUserEmail,
  assignedToId,
}: TicketCommentsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [commentText, setCommentText] = useState("");

  // Ticket owner and assigned technician can always comment
  const isOwner = currentUser.email === reportedByEmail;
  const isAssigned =
    (assignedUserEmail && currentUser.email === assignedUserEmail) ||
    (assignedToId && currentUser._id === assignedToId);

  // Others need update permission (admin/manager)
  const hasUpdatePermission = hasPermission(userRole, "tickets", "update");

  // Can comment if: owner, assigned, or has update permission
  const canComment = isOwner || isAssigned || hasUpdatePermission;

  const handleAddComment = () => {
    if (!commentText.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await addCommentToTicket(
        ticketId,
        commentText.trim(),
        currentUser._id,
        currentUser.name,
        currentUser.email,
      );

      if (result.success) {
        setCommentText("");
        toast({
          title: "Success",
          description: "Comment added successfully",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add comment",
          variant: "destructive",
        });
      }
    });
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment._id?.toString()}
                className="flex gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(comment.createdAt),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet
          </p>
        )}

        {/* Add Comment Form */}
        {canComment ? (
          <div className="space-y-3 pt-2 border-t">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              disabled={isPending}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={isPending || !commentText.trim()}
                size="sm"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Add Comment
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2 border-t">
            Only the ticket owner, assigned technician, or authorized users can
            comment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
