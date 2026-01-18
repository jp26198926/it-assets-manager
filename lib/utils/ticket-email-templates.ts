import type { Ticket, TicketStatus } from "@/lib/models/types";
import { format } from "date-fns";

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_parts: "Waiting for Parts",
  resolved: "Resolved",
  closed: "Closed",
  defective_closed: "Defective - Closed",
};

const priorityColors = {
  low: "#6b7280",
  medium: "#3b82f6",
  high: "#f59e0b",
  critical: "#ef4444",
};

const statusColors: Record<TicketStatus, string> = {
  open: "#ef4444",
  in_progress: "#f59e0b",
  waiting_parts: "#3b82f6",
  resolved: "#22c55e",
  closed: "#6b7280",
  defective_closed: "#ef4444",
};

/**
 * New ticket created notification
 */
export function newTicketCreatedEmail(
  ticket: Ticket,
  reporterName: string,
  assignedUserName?: string,
): string {
  return `
    <h2>New Ticket Created</h2>
    <p>A new support ticket has been created and requires attention.</p>
    
    <div class="info-box">
      <strong>Ticket Number:</strong>
      <span style="font-family: monospace; font-size: 16px;">${ticket.ticketNumber}</span>
    </div>

    <div class="info-box">
      <strong>Title:</strong>
      ${ticket.title}
    </div>

    <div class="info-box">
      <strong>Priority:</strong>
      <span style="color: ${priorityColors[ticket.priority]}; font-weight: 600; text-transform: uppercase;">
        ${ticket.priority}
      </span>
    </div>

    <div class="info-box">
      <strong>Category:</strong>
      ${ticket.category}
    </div>

    <div class="info-box">
      <strong>Reported By:</strong>
      ${reporterName}
    </div>

    ${
      assignedUserName
        ? `
    <div class="info-box">
      <strong>Assigned To:</strong>
      ${assignedUserName}
    </div>
    `
        : ""
    }

    ${
      ticket.itemBarcode
        ? `
    <div class="info-box">
      <strong>Related Item:</strong>
      ${ticket.itemBarcode}
    </div>
    `
        : ""
    }

    <div class="info-box">
      <strong>Description:</strong>
      <div style="margin-top: 10px;">
        ${ticket.description}
      </div>
    </div>

    <div class="info-box">
      <strong>Created:</strong>
      ${format(new Date(ticket.createdAt), "MMMM d, yyyy 'at' h:mm a")}
    </div>

    <p style="margin-top: 30px;">Please review and take appropriate action.</p>
  `;
}

/**
 * Ticket status updated notification
 */
export function ticketStatusUpdatedEmail(
  ticket: Ticket,
  oldStatus: TicketStatus,
  newStatus: TicketStatus,
  updatedBy: string,
): string {
  return `
    <h2>Ticket Status Updated</h2>
    <p>The status of your ticket has been updated.</p>
    
    <div class="info-box">
      <strong>Ticket Number:</strong>
      <span style="font-family: monospace; font-size: 16px;">${ticket.ticketNumber}</span>
    </div>

    <div class="info-box">
      <strong>Title:</strong>
      ${ticket.title}
    </div>

    <div class="info-box">
      <strong>Status Change:</strong>
      <div style="margin-top: 10px;">
        <span style="color: ${statusColors[oldStatus]}; font-weight: 600;">
          ${statusLabels[oldStatus]}
        </span>
        <span style="margin: 0 10px;">→</span>
        <span style="color: ${statusColors[newStatus]}; font-weight: 600;">
          ${statusLabels[newStatus]}
        </span>
      </div>
    </div>

    <div class="info-box">
      <strong>Updated By:</strong>
      ${updatedBy}
    </div>

    <div class="info-box">
      <strong>Updated:</strong>
      ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
    </div>

    ${
      newStatus === "resolved"
        ? `
    <p style="color: #22c55e; font-weight: 600; margin-top: 20px;">
      ✓ Your ticket has been marked as resolved. If you still need assistance, please reopen the ticket or create a new one.
    </p>
    `
        : ""
    }

    ${
      newStatus === "closed"
        ? `
    <p style="margin-top: 20px;">
      This ticket has been closed. If you need further assistance, please create a new ticket.
    </p>
    `
        : ""
    }
  `;
}

/**
 * Ticket assigned notification
 */
export function ticketAssignedEmail(
  ticket: Ticket,
  assignedToName: string,
  assignedBy: string,
): string {
  return `
    <h2>Ticket Assigned to You</h2>
    <p>A ticket has been assigned to you for resolution.</p>
    
    <div class="info-box">
      <strong>Ticket Number:</strong>
      <span style="font-family: monospace; font-size: 16px;">${ticket.ticketNumber}</span>
    </div>

    <div class="info-box">
      <strong>Title:</strong>
      ${ticket.title}
    </div>

    <div class="info-box">
      <strong>Priority:</strong>
      <span style="color: ${priorityColors[ticket.priority]}; font-weight: 600; text-transform: uppercase;">
        ${ticket.priority}
      </span>
    </div>

    <div class="info-box">
      <strong>Status:</strong>
      <span style="color: ${statusColors[ticket.status]}; font-weight: 600;">
        ${statusLabels[ticket.status]}
      </span>
    </div>

    <div class="info-box">
      <strong>Category:</strong>
      ${ticket.category}
    </div>

    ${
      ticket.itemBarcode
        ? `
    <div class="info-box">
      <strong>Related Item:</strong>
      ${ticket.itemBarcode}
    </div>
    `
        : ""
    }

    <div class="info-box">
      <strong>Description:</strong>
      <div style="margin-top: 10px;">
        ${ticket.description}
      </div>
    </div>

    <div class="info-box">
      <strong>Assigned By:</strong>
      ${assignedBy}
    </div>

    <div class="info-box">
      <strong>Assigned:</strong>
      ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
    </div>

    <p style="margin-top: 30px;">Please review the ticket details and take appropriate action.</p>
  `;
}

/**
 * Ticket comment added notification
 */
export function ticketCommentAddedEmail(
  ticket: Ticket,
  commentText: string,
  commentBy: string,
): string {
  return `
    <h2>New Comment on Ticket</h2>
    <p>A new comment has been added to your ticket.</p>
    
    <div class="info-box">
      <strong>Ticket Number:</strong>
      <span style="font-family: monospace; font-size: 16px;">${ticket.ticketNumber}</span>
    </div>

    <div class="info-box">
      <strong>Title:</strong>
      ${ticket.title}
    </div>

    <div class="info-box">
      <strong>Comment By:</strong>
      ${commentBy}
    </div>

    <div class="info-box">
      <strong>Comment:</strong>
      <div style="margin-top: 10px; padding: 15px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
        ${commentText}
      </div>
    </div>

    <div class="info-box">
      <strong>Posted:</strong>
      ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
    </div>
  `;
}

/**
 * Guest ticket created notification
 */
export function guestTicketCreatedEmail(
  ticketNumber: string,
  title: string,
  trackingUrl: string,
): string {
  return `
    <h2>Thank You for Contacting Us</h2>
    <p>Your support ticket has been created successfully. Our team will review it and get back to you soon.</p>
    
    <div class="info-box">
      <strong>Ticket Number:</strong>
      <span style="font-family: monospace; font-size: 16px;">${ticketNumber}</span>
    </div>

    <div class="info-box">
      <strong>Subject:</strong>
      ${title}
    </div>

    <p style="margin-top: 20px;">You can track your ticket status using the link below:</p>
    
    <a href="${trackingUrl}" class="button">Track Ticket</a>

    <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
      Please save your ticket number for future reference.
    </p>
  `;
}
