"use server";

import { sendEmail, generateEmailTemplate } from "./email";
import {
  newTicketCreatedEmail,
  ticketStatusUpdatedEmail,
  ticketAssignedEmail,
  ticketCommentAddedEmail,
  guestTicketCreatedEmail,
} from "./ticket-email-templates";
import type { Ticket, TicketStatus } from "@/lib/models/types";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Get company name from settings
 */
async function getCompanyName(): Promise<string> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("settings").findOne({});
    return settings?.companyName || "IT Support System";
  } catch (error) {
    return "IT Support System";
  }
}

/**
 * Get user email by ID
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const db = await getDatabase();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    return user?.email || null;
  } catch (error) {
    console.error("Error fetching user email:", error);
    return null;
  }
}

/**
 * Send notification when a new ticket is created
 */
export async function sendNewTicketNotification(
  ticket: Ticket,
  reporterName: string,
  reporterEmail: string,
  assignedUserName?: string,
  assignedUserEmail?: string,
): Promise<void> {
  try {
    const companyName = await getCompanyName();
    const content = newTicketCreatedEmail(
      ticket,
      reporterName,
      assignedUserName,
    );
    const html = await generateEmailTemplate(companyName, content);

    const recipients: string[] = [];

    // Always notify the reporter
    if (reporterEmail) {
      recipients.push(reporterEmail);
    }

    // Notify assigned user if different from reporter
    if (assignedUserEmail && assignedUserEmail !== reporterEmail) {
      recipients.push(assignedUserEmail);
    }

    // Get managers and admins from database
    const db = await getDatabase();
    const usersCollection = db.collection("users");
    const managersAndAdmins = await usersCollection
      .find({
        role: { $in: ["manager", "admin"] },
      })
      .toArray();

    // Add managers and admins to recipients (avoiding duplicates)
    for (const user of managersAndAdmins) {
      if (user.email && !recipients.includes(user.email)) {
        recipients.push(user.email);
      }
    }

    if (recipients.length > 0) {
      await sendEmail({
        to: recipients,
        subject: `New Ticket: ${ticket.ticketNumber} - ${ticket.title}`,
        html,
      });
    }
  } catch (error) {
    console.error("Error sending new ticket notification:", error);
  }
}

/**
 * Send notification when ticket status is updated
 */
export async function sendTicketStatusUpdateNotification(
  ticket: Ticket,
  oldStatus: TicketStatus,
  newStatus: TicketStatus,
  updatedByName: string,
): Promise<void> {
  try {
    const companyName = await getCompanyName();
    const content = ticketStatusUpdatedEmail(
      ticket,
      oldStatus,
      newStatus,
      updatedByName,
    );
    const html = await generateEmailTemplate(companyName, content);

    const recipients: string[] = [];

    // Notify the reporter
    if (ticket.reportedBy?.email) {
      recipients.push(ticket.reportedBy.email);
    }

    // Notify assigned user if exists and different from reporter
    if (ticket.assignedToId) {
      const assignedEmail = await getUserEmail(ticket.assignedToId.toString());
      if (assignedEmail && assignedEmail !== ticket.reportedBy?.email) {
        recipients.push(assignedEmail);
      }
    }

    // If ticket is resolved, closed, or defective_closed, notify managers
    if (
      newStatus === "resolved" ||
      newStatus === "closed" ||
      newStatus === "defective_closed"
    ) {
      const db = await getDatabase();
      const usersCollection = db.collection("users");
      const managers = await usersCollection
        .find({
          role: "manager",
        })
        .toArray();

      // Add managers to recipients (avoiding duplicates)
      for (const manager of managers) {
        if (manager.email && !recipients.includes(manager.email)) {
          recipients.push(manager.email);
        }
      }
    }

    if (recipients.length > 0) {
      await sendEmail({
        to: recipients,
        subject: `Ticket Update: ${ticket.ticketNumber} - Status changed to ${newStatus.replace("_", " ")}`,
        html,
      });
    }
  } catch (error) {
    console.error("Error sending ticket status update notification:", error);
  }
}

/**
 * Send notification when ticket is assigned to a user
 */
export async function sendTicketAssignedNotification(
  ticket: Ticket,
  assignedToName: string,
  assignedToEmail: string,
  assignedByName: string,
): Promise<void> {
  try {
    const companyName = await getCompanyName();
    const content = ticketAssignedEmail(ticket, assignedToName, assignedByName);
    const html = await generateEmailTemplate(companyName, content);

    await sendEmail({
      to: assignedToEmail,
      subject: `Ticket Assigned: ${ticket.ticketNumber} - ${ticket.title}`,
      html,
    });
  } catch (error) {
    console.error("Error sending ticket assigned notification:", error);
  }
}

/**
 * Send notification when a comment is added to a ticket
 */
export async function sendTicketCommentNotification(
  ticket: Ticket,
  commentText: string,
  commentByName: string,
  commentByEmail: string,
): Promise<void> {
  try {
    const companyName = await getCompanyName();
    const content = ticketCommentAddedEmail(ticket, commentText, commentByName);
    const html = await generateEmailTemplate(companyName, content);

    const recipients: string[] = [];

    // Notify the reporter if they didn't add the comment
    if (
      ticket.reportedBy?.email &&
      ticket.reportedBy.email !== commentByEmail
    ) {
      recipients.push(ticket.reportedBy.email);
    }

    // Notify assigned user if exists and didn't add the comment
    if (ticket.assignedToId) {
      const assignedEmail = await getUserEmail(ticket.assignedToId.toString());
      if (assignedEmail && assignedEmail !== commentByEmail) {
        recipients.push(assignedEmail);
      }
    }

    if (recipients.length > 0) {
      await sendEmail({
        to: recipients,
        subject: `New Comment: ${ticket.ticketNumber} - ${ticket.title}`,
        html,
      });
    }
  } catch (error) {
    console.error("Error sending ticket comment notification:", error);
  }
}

/**
 * Send notification for guest ticket creation
 */
export async function sendGuestTicketConfirmation(
  ticketNumber: string,
  title: string,
  email: string,
  trackingUrl: string,
): Promise<void> {
  try {
    const companyName = await getCompanyName();
    const content = guestTicketCreatedEmail(ticketNumber, title, trackingUrl);
    const html = await generateEmailTemplate(companyName, content);

    await sendEmail({
      to: email,
      subject: `Ticket Created: ${ticketNumber} - ${title}`,
      html,
    });
  } catch (error) {
    console.error("Error sending guest ticket confirmation:", error);
  }
}
