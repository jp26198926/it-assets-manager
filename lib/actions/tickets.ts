"use server"

import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/models/types"
import { revalidatePath } from "next/cache"

async function generateTicketNumber(): Promise<string> {
  const db = await getDatabase()
  const collection = db.collection<Ticket>("tickets")

  const year = new Date().getFullYear()
  const count = await collection.countDocuments()
  const number = (count + 1).toString().padStart(5, "0")

  return `TKT-${year}-${number}`
}

export async function createTicket(data: {
  title: string
  description: string
  priority: TicketPriority
  category: string
  reportedBy: {
    name: string
    email: string
    department?: string
  }
  itemId?: string
  itemBarcode?: string
  itemName?: string
}): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  try {
    const db = await getDatabase()
    const collection = db.collection<Ticket>("tickets")

    const ticketNumber = await generateTicketNumber()

    const ticket: Ticket = {
      ticketNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: "open",
      category: data.category,
      reportedBy: data.reportedBy,
      itemId: data.itemId ? new ObjectId(data.itemId) : undefined,
      itemBarcode: data.itemBarcode,
      itemName: data.itemName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(ticket)
    ticket._id = result.insertedId

    revalidatePath("/tickets")
    return { success: true, ticket }
  } catch (error) {
    console.error("Error creating ticket:", error)
    return { success: false, error: "Failed to create ticket" }
  }
}

export async function getTickets(filters?: {
  status?: TicketStatus
  priority?: TicketPriority
  search?: string
}): Promise<Ticket[]> {
  try {
    const db = await getDatabase()
    const collection = db.collection<Ticket>("tickets")

    const query: Record<string, unknown> = {}

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.priority) {
      query.priority = filters.priority
    }

    if (filters?.search) {
      query.$or = [
        { ticketNumber: { $regex: filters.search, $options: "i" } },
        { title: { $regex: filters.search, $options: "i" } },
        { "reportedBy.name": { $regex: filters.search, $options: "i" } },
        { itemBarcode: { $regex: filters.search, $options: "i" } },
      ]
    }

    const tickets = await collection.find(query).sort({ createdAt: -1 }).toArray()
    return JSON.parse(JSON.stringify(tickets))
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return []
  }
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  try {
    const db = await getDatabase()
    const collection = db.collection<Ticket>("tickets")
    const ticket = await collection.findOne({ _id: new ObjectId(id) })
    return ticket ? JSON.parse(JSON.stringify(ticket)) : null
  } catch (error) {
    console.error("Error fetching ticket:", error)
    return null
  }
}

export async function getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
  try {
    const db = await getDatabase()
    const collection = db.collection<Ticket>("tickets")
    const ticket = await collection.findOne({ ticketNumber })
    return ticket ? JSON.parse(JSON.stringify(ticket)) : null
  } catch (error) {
    console.error("Error fetching ticket:", error)
    return null
  }
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  assignedTo?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase()
    const collection = db.collection<Ticket>("tickets")

    const update: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    if (assignedTo) {
      update.assignedTo = assignedTo
    }

    if (status === "resolved") {
      update.resolvedAt = new Date()
    }

    if (status === "closed") {
      update.closedAt = new Date()
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: update })

    revalidatePath("/tickets")
    return { success: true }
  } catch (error) {
    console.error("Error updating ticket:", error)
    return { success: false, error: "Failed to update ticket" }
  }
}

export async function getTicketStats() {
  try {
    const db = await getDatabase()
    const collection = db.collection<Ticket>("tickets")

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: "open" }),
      collection.countDocuments({ status: "in_progress" }),
      collection.countDocuments({ status: "resolved" }),
      collection.countDocuments({ status: "closed" }),
    ])

    return { total, open, inProgress, resolved, closed }
  } catch (error) {
    console.error("Error fetching ticket stats:", error)
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }
  }
}
