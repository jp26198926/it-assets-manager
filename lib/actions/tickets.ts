"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/models/types";
import { revalidatePath } from "next/cache";
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

  const year = new Date().getFullYear();
  const count = await collection.countDocuments();
  const number = (count + 1).toString().padStart(5, "0");

  return `TKT-${year}-${number}`;
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
}): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  try {
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
    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

    const query: Record<string, unknown> = {};

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
    const db = await getDatabase();
    const collection = db.collection<Ticket>("tickets");

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

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });

    revalidatePath("/tickets");
    return { success: true };
  } catch (error) {
    console.error("Error updating ticket:", error);
    return { success: false, error: "Failed to update ticket" };
  }
}

export async function getTicketStats() {
  try {
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

// Get tickets with populated department data
export async function getTicketsWithDepartment(filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}) {
  try {
    const db = await getDatabase();
    const ticketsCollection = db.collection("tickets");
    const departmentsCollection = db.collection("departments");

    const query: Record<string, unknown> = {};

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
    const db = await getDatabase();
    const ticketsCollection = db.collection("tickets");

    const tickets = await ticketsCollection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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

    return tickets.length > 0 ? serializeTicket(tickets[0]) : null;
  } catch (error) {
    console.error("Error fetching ticket with department:", error);
    return null;
  }
}
