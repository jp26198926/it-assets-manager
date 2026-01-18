"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/models/types";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth";
import { hasPermission } from "../models/User";
// Helper function to serialize tickets for client components
function serializeTicket(ticket: any) {
  return {
    ...ticket,
    _id: ticket._id?.toString(),
    itemId: ticket.itemId?.toString(),
    assignedToId: ticket.assignedToId?.toString(),
    createdAt: ticket.createdAt?.toISOString?.() || ticket.createdAt,
    updatedAt: ticket.updatedAt?.toISOString?.() || ticket.updatedAt,
    resolvedAt: ticket.resolvedAt?.toISOString?.() || ticket.resolvedAt,
    closedAt: ticket.closedAt?.toISOString?.() || ticket.closedAt,
    comments:
      ticket.comments?.map((comment: any) => ({
        _id: comment._id?.toString(),
        userId: comment.userId?.toString(),
        userName: comment.userName,
        userEmail: comment.userEmail,
        comment: comment.comment,
        createdAt: comment.createdAt?.toISOString?.() || comment.createdAt,
      })) || [],
    reportedBy: {
      ...ticket.reportedBy,
      departmentId: ticket.reportedBy?.departmentId?.toString(),
      department: ticket.reportedBy?.department
        ? {
            _id: ticket.reportedBy.department._id?.toString(),
            name: ticket.reportedBy.department.name,
            code: ticket.reportedBy.department.code,
          }
        : undefined,
    },
    assignedUser: ticket.assignedUser
      ? {
          _id: ticket.assignedUser._id?.toString(),
          name: ticket.assignedUser.name,
          email: ticket.assignedUser.email,
          role: ticket.assignedUser.role,
        }
      : undefined,
  };
}
async function generateTicketNumber(): Promise<string> {
  const db = await getDatabase();
  const collection = db.collection<Ticket>("tickets");

  const year = new Date().getFullYear().toString().slice(-2); // Get last 2 digits of year
  const count = await collection.countDocuments();
  const number = (count + 1).toString().padStart(5, "0");

  return `IT${year}${number}`;
}

export async function createTicket(data: {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  reportedBy: {
    name: string;
    email: string;
    departmentId?: string;
  };
  itemId?: string;
  itemBarcode?: string;
  itemName?: string;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
}): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "tickets", "create")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    const ticketNumber = await generateTicketNumber();

    const ticket: Ticket = {
      ticketNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: "open",
      category: data.category,
      reportedBy: {
        name: data.reportedBy.name,
        email: data.reportedBy.email,
        departmentId: data.reportedBy.departmentId
          ? new ObjectId(data.reportedBy.departmentId)
          : undefined,
      },
      itemId: data.itemId ? new ObjectId(data.itemId) : undefined,
      itemBarcode: data.itemBarcode,
      itemName: data.itemName,
      attachments: data.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(ticket);
    ticket._id = result.insertedId;

    revalidatePath("/tickets");
    return { success: true, ticket };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: "Failed to create ticket" };
  }
}

export async function getTickets(filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}): Promise<Ticket[]> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "tickets", "read")) {
      return [];
    }

    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    const query: Record<string, unknown> = {};

    // Role-based filtering
    if (user.role === "employee") {
      query["reportedBy.email"] = user.email;
    } else if (user.role === "technician") {
      query.$or = [
        { "reportedBy.email": user.email },
        { assignedToId: new ObjectId(user.id) },
      ];
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.priority) {
      query.priority = filters.priority;
    }

    if (filters?.search) {
      query.$or = [
        { ticketNumber: { $regex: filters.search, $options: "i" } },
        { title: { $regex: filters.search, $options: "i" } },
        { "reportedBy.name": { $regex: filters.search, $options: "i" } },
        { itemBarcode: { $regex: filters.search, $options: "i" } },
      ];
    }

    const tickets = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    return JSON.parse(JSON.stringify(tickets));
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");
    const ticket = await collection.findOne({ _id: new ObjectId(id) });
    return ticket ? JSON.parse(JSON.stringify(ticket)) : null;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }
}

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");
    const ticket = await collection.findOne({ ticketNumber });
    return ticket ? JSON.parse(JSON.stringify(ticket)) : null;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  assignedToId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "tickets", "update")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const ticketsCollection = db.collection<Ticket>("tickets");

    // First, get the ticket to check if it has an associated item
    const ticket = await ticketsCollection.findOne({ _id: new ObjectId(id) });

    const update: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (assignedToId) {
      update.assignedToId = new ObjectId(assignedToId);
    }

    if (status === "resolved") {
      update.resolvedAt = new Date();
    }

    if (status === "closed") {
      update.closedAt = new Date();
    }

    await ticketsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: update },
    );

    // Update inventory item status based on ticket status
    if (ticket?.itemId) {
      const inventoryCollection = db.collection("inventory");
      let itemStatus: string | null = null;

      switch (status) {
        case "open":
        case "in_progress":
        case "waiting_parts":
          itemStatus = "under_repair";
          break;
        case "defective_closed":
          itemStatus = "beyond_repair";
          break;
        case "resolved":
        case "closed":
          // Check if there are other open tickets for this item
          const openTicketsCount = await ticketsCollection.countDocuments({
            itemId: ticket.itemId,
            status: {
              $in: ["open", "in_progress", "waiting_parts"],
            },
            _id: { $ne: new ObjectId(id) },
          });

          // Only change status if no other open tickets
          if (openTicketsCount === 0) {
            itemStatus = "in_stock";
          }
          break;
      }

      if (itemStatus) {
        await inventoryCollection.updateOne(
          { _id: ticket.itemId },
          { $set: { status: itemStatus, updatedAt: new Date() } },
        );
        revalidatePath("/inventory");
        revalidatePath(`/inventory/${ticket.itemId.toString()}`);
      }
    }

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating ticket:", error);
    return { success: false, error: "Failed to update ticket" };
  }
}

export async function getTicketStats() {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "tickets", "read")) {
      return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
    }

    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: "open" }),
      collection.countDocuments({ status: "in_progress" }),
      collection.countDocuments({ status: "resolved" }),
      collection.countDocuments({ status: "closed" }),
    ]);

    return { total, open, inProgress, resolved, closed };
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  }
}

export async function getTicketTrends(
  period: "daily" | "weekly" | "monthly" | "yearly",
) {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "tickets", "read")) {
      return [];
    }

    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    // Calculate date range and grouping based on period
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    let numPeriods: number;

    switch (period) {
      case "daily":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        dateFormat = "%Y-%m-%d";
        numPeriods = 30;
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        dateFormat = "%Y-W%V";
        numPeriods = 12;
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
        dateFormat = "%Y-%m";
        numPeriods = 12;
        break;
      case "yearly":
        startDate = new Date(now.getFullYear() - 4, 0, 1); // Last 5 years
        dateFormat = "%Y";
        numPeriods = 5;
        break;
    }

    // Role-based query filter
    const matchQuery: Record<string, unknown> = {
      createdAt: { $gte: startDate },
    };

    if (user.role === "employee") {
      matchQuery["reportedBy.email"] = user.email;
    } else if (user.role === "technician") {
      matchQuery.$or = [
        { "reportedBy.email": user.email },
        { assignedToId: new ObjectId(user.id) },
      ];
    }

    // Aggregate tickets by period
    const receivedData = await collection
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Get resolved tickets
    const resolvedMatchQuery = {
      ...matchQuery,
      resolvedAt: { $gte: startDate, $ne: null },
    };

    const resolvedData = await collection
      .aggregate([
        { $match: resolvedMatchQuery },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$resolvedAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Create a map for easy lookup
    const receivedMap = new Map(receivedData.map((d) => [d._id, d.count]));
    const resolvedMap = new Map(resolvedData.map((d) => [d._id, d.count]));

    // Generate complete date range
    const trends = [];
    for (let i = numPeriods - 1; i >= 0; i--) {
      let date: Date;
      let label: string;

      switch (period) {
        case "daily":
          date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          label = date.toISOString().split("T")[0];
          break;
        case "weekly":
          date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          const year = date.getFullYear();
          const week = getWeekNumber(date);
          label = `${year}-W${week.toString().padStart(2, "0")}`;
          break;
        case "monthly":
          date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          label = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
          break;
        case "yearly":
          date = new Date(now.getFullYear() - i, 0, 1);
          label = date.getFullYear().toString();
          break;
      }

      trends.push({
        period: formatPeriodLabel(label, period),
        received: receivedMap.get(label) || 0,
        resolved: resolvedMap.get(label) || 0,
      });
    }

    return trends;
  } catch (error) {
    console.error("Error fetching ticket trends:", error);
    return [];
  }
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Helper function to format period labels
function formatPeriodLabel(label: string, period: string): string {
  if (period === "daily") {
    const date = new Date(label);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else if (period === "weekly") {
    return label.replace("W", "Week ");
  } else if (period === "monthly") {
    const [year, month] = label.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } else {
    return label;
  }
}

// Get tickets with populated department data
export async function getTicketsWithDepartment(filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  activeOnly?: boolean;
}) {
  try {
    const user = await requireAuth();

    const db = await getDatabase();
    const ticketsCollection = db.collection("tickets");
    const departmentsCollection = db.collection("departments");

    const query: Record<string, unknown> = {};

    // Role-based filtering
    if (user.role === "employee") {
      // Employee can only see their own tickets
      query["reportedBy.email"] = user.email;
    } else if (user.role === "technician") {
      // Technician can see their own tickets OR tickets assigned to them
      query.$or = [
        { "reportedBy.email": user.email },
        { assignedToId: new ObjectId(user.id) },
      ];
    }
    // Admin and manager can see all tickets (no additional filter)

    if (filters?.activeOnly) {
      // Active tickets: Open, In Progress, Waiting Parts
      query.status = { $in: ["open", "in_progress", "waiting_parts"] };
    } else if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.priority) {
      query.priority = filters.priority;
    }

    if (filters?.search) {
      const searchConditions = [
        { ticketNumber: { $regex: filters.search, $options: "i" } },
        { title: { $regex: filters.search, $options: "i" } },
        { "reportedBy.name": { $regex: filters.search, $options: "i" } },
        { itemBarcode: { $regex: filters.search, $options: "i" } },
      ];

      // If there's already an $or from role filtering, combine them with $and
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const tickets = await ticketsCollection
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "departments",
            localField: "reportedBy.departmentId",
            foreignField: "_id",
            as: "departmentData",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignedToId",
            foreignField: "_id",
            as: "assignedUserData",
          },
        },
        {
          $addFields: {
            "reportedBy.department": {
              $cond: {
                if: { $gt: [{ $size: "$departmentData" }, 0] },
                then: {
                  _id: { $arrayElemAt: ["$departmentData._id", 0] },
                  name: { $arrayElemAt: ["$departmentData.name", 0] },
                  code: { $arrayElemAt: ["$departmentData.code", 0] },
                },
                else: null,
              },
            },
            assignedUser: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$assignedToId", null] },
                    { $gt: [{ $size: "$assignedUserData" }, 0] },
                  ],
                },
                then: {
                  _id: { $arrayElemAt: ["$assignedUserData._id", 0] },
                  name: { $arrayElemAt: ["$assignedUserData.name", 0] },
                  email: { $arrayElemAt: ["$assignedUserData.email", 0] },
                  role: { $arrayElemAt: ["$assignedUserData.role", 0] },
                },
                else: null,
              },
            },
          },
        },
        { $project: { departmentData: 0, assignedUserData: 0 } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return tickets.map(serializeTicket);
  } catch (error) {
    console.error("Error fetching tickets with department:", error);
    return [];
  }
}

// Get single ticket with populated department data
export async function getTicketWithDepartment(id: string) {
  try {
    const user = await requireAuth();

    const db = await getDatabase();
    const ticketsCollection = db.collection("tickets");

    // First get the ticket to check access
    const matchQuery: Record<string, unknown> = { _id: new ObjectId(id) };

    const tickets = await ticketsCollection
      .aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: "departments",
            localField: "reportedBy.departmentId",
            foreignField: "_id",
            as: "departmentData",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignedToId",
            foreignField: "_id",
            as: "assignedUserData",
          },
        },
        {
          $addFields: {
            "reportedBy.department": {
              $cond: {
                if: { $gt: [{ $size: "$departmentData" }, 0] },
                then: {
                  _id: { $arrayElemAt: ["$departmentData._id", 0] },
                  name: { $arrayElemAt: ["$departmentData.name", 0] },
                  code: { $arrayElemAt: ["$departmentData.code", 0] },
                },
                else: null,
              },
            },
            assignedUser: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$assignedToId", null] },
                    { $gt: [{ $size: "$assignedUserData" }, 0] },
                  ],
                },
                then: {
                  _id: { $arrayElemAt: ["$assignedUserData._id", 0] },
                  name: { $arrayElemAt: ["$assignedUserData.name", 0] },
                  email: { $arrayElemAt: ["$assignedUserData.email", 0] },
                  role: { $arrayElemAt: ["$assignedUserData.role", 0] },
                },
                else: null,
              },
            },
          },
        },
        { $project: { departmentData: 0, assignedUserData: 0 } },
      ])
      .toArray();

    if (tickets.length === 0) {
      return null;
    }

    const ticket = tickets[0];

    // Role-based access control
    if (user.role === "employee") {
      // Employee can only view their own tickets
      if (ticket.reportedBy?.email !== user.email) {
        return null;
      }
    } else if (user.role === "technician") {
      // Technician can view their own tickets OR tickets assigned to them
      const isReporter = ticket.reportedBy?.email === user.email;
      const isAssigned = ticket.assignedToId?.toString() === user.id;
      if (!isReporter && !isAssigned) {
        return null;
      }
    }
    // Admin and manager can view all tickets

    return serializeTicket(ticket);
  } catch (error) {
    console.error("Error fetching ticket with department:", error);
    return null;
  }
}

export async function addCommentToTicket(
  ticketId: string,
  comment: string,
  userId: string,
  userName: string,
  userEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    // Get the ticket to check ownership/assignment
    const ticket = await collection.findOne({ _id: new ObjectId(ticketId) });

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    // Check if user can comment: owner, assigned technician, or has update permission
    const isOwner = ticket.reportedBy.email === user.email;
    const isAssigned = ticket.assignedToId?.toString() === user.id;
    const hasUpdatePermission = hasPermission(user.role, "tickets", "update");

    if (!isOwner && !isAssigned && !hasUpdatePermission) {
      return { success: false, error: "Unauthorized" };
    }

    const newComment = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      userName,
      userEmail,
      comment,
      createdAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(ticketId) },
      {
        $push: { comments: newComment } as any,
        $set: { updatedAt: new Date() },
      },
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Ticket not found" };
    }

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");

    return { success: true };
  } catch (error) {
    console.error("Error adding comment to ticket:", error);
    return { success: false, error: "Failed to add comment" };
  }
}

export async function getTicketsByItemId(itemId: string) {
  try {
    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    const tickets = await collection
      .aggregate([
        { $match: { itemId: new ObjectId(itemId) } },
        {
          $lookup: {
            from: "users",
            localField: "assignedToId",
            foreignField: "_id",
            as: "assignedUserData",
          },
        },
        {
          $addFields: {
            assignedUser: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$assignedToId", null] },
                    { $gt: [{ $size: "$assignedUserData" }, 0] },
                  ],
                },
                then: {
                  _id: { $arrayElemAt: ["$assignedUserData._id", 0] },
                  name: { $arrayElemAt: ["$assignedUserData.name", 0] },
                  email: { $arrayElemAt: ["$assignedUserData.email", 0] },
                  role: { $arrayElemAt: ["$assignedUserData.role", 0] },
                },
                else: null,
              },
            },
          },
        },
        { $project: { assignedUserData: 0 } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return tickets.map(serializeTicket);
  } catch (error) {
    console.error("Error fetching tickets by item ID:", error);
    return [];
  }
}

// Guest ticket creation (no authentication required)
export async function createGuestTicket(data: {
  name: string;
  email: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  formStartTime: number;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;
}): Promise<{ success: boolean; ticketNumber?: string; error?: string }> {
  try {
    // Server-side time-based verification (minimum 3 seconds)
    const timeSpent = Date.now() - data.formStartTime;
    if (timeSpent < 3000) {
      return { success: false, error: "Form submitted too quickly" };
    }

    // Additional rate limiting: max 30 seconds to prevent extremely slow submissions
    if (timeSpent > 1800000) {
      // 30 minutes
      return {
        success: false,
        error: "Session expired, please refresh and try again",
      };
    }

    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    const ticketNumber = await generateTicketNumber();

    const ticket: Ticket = {
      ticketNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: "open",
      category: data.category,
      reportedBy: {
        name: data.name,
        email: data.email,
      },
      attachments: data.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(ticket);

    revalidatePath("/");
    revalidatePath("/tickets");

    return { success: true, ticketNumber };
  } catch (error) {
    console.error("Error creating guest ticket:", error);
    return { success: false, error: "Failed to create ticket" };
  }
}

// Track guest ticket (no authentication required)
export async function trackGuestTicket(
  ticketNumber: string,
): Promise<{ success: boolean; ticket?: any; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    const ticket = await collection.findOne({ ticketNumber });

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    return { success: true, ticket: serializeTicket(ticket) };
  } catch (error) {
    console.error("Error tracking guest ticket:", error);
    return { success: false, error: "Failed to track ticket" };
  }
}
