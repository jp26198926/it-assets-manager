"use server"

import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type { RepairRecord, RepairOutcome, InventoryItem, Ticket } from "@/lib/models/types"
import { revalidatePath } from "next/cache"

export async function createRepairRecord(data: {
  ticketId: string
  ticketNumber: string
  itemId: string
  itemBarcode: string
  itemName: string
  technicianName: string
  diagnosis?: string
  notes?: string
}): Promise<{ success: boolean; repair?: RepairRecord; error?: string }> {
  try {
    const db = await getDatabase()
    const repairCollection = db.collection<RepairRecord>("repairs")
    const inventoryCollection = db.collection<InventoryItem>("inventory")
    const ticketCollection = db.collection<Ticket>("tickets")

    const repair: RepairRecord = {
      ticketId: new ObjectId(data.ticketId),
      ticketNumber: data.ticketNumber,
      itemId: new ObjectId(data.itemId),
      itemBarcode: data.itemBarcode,
      itemName: data.itemName,
      technicianName: data.technicianName,
      receivedAt: new Date(),
      diagnosis: data.diagnosis,
      outcome: "pending",
      returnedToUser: false,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await repairCollection.insertOne(repair)
    repair._id = result.insertedId

    await inventoryCollection.updateOne(
      { _id: new ObjectId(data.itemId) },
      { $set: { status: "under_repair", updatedAt: new Date() } },
    )

    await ticketCollection.updateOne(
      { _id: new ObjectId(data.ticketId) },
      { $set: { status: "in_progress", updatedAt: new Date() } },
    )

    revalidatePath("/repairs")
    revalidatePath("/inventory")
    revalidatePath("/tickets")
    return { success: true, repair }
  } catch (error) {
    console.error("Error creating repair record:", error)
    return { success: false, error: "Failed to create repair record" }
  }
}

export async function updateRepairRecord(
  id: string,
  data: {
    diagnosis?: string
    actionsTaken?: string
    partsUsed?: string[]
    outcome?: RepairOutcome
    notes?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase()
    const collection = db.collection<RepairRecord>("repairs")

    const update: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    }

    if (data.outcome && data.outcome !== "pending") {
      update.completedAt = new Date()
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: update })

    revalidatePath("/repairs")
    return { success: true }
  } catch (error) {
    console.error("Error updating repair record:", error)
    return { success: false, error: "Failed to update repair record" }
  }
}

export async function completeRepair(
  id: string,
  outcome: RepairOutcome,
  actionsTaken: string,
  partsUsed?: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase()
    const repairCollection = db.collection<RepairRecord>("repairs")
    const inventoryCollection = db.collection<InventoryItem>("inventory")
    const ticketCollection = db.collection<Ticket>("tickets")

    const repair = await repairCollection.findOne({ _id: new ObjectId(id) })
    if (!repair) {
      return { success: false, error: "Repair record not found" }
    }

    await repairCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          outcome,
          actionsTaken,
          partsUsed,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    const itemStatus = outcome === "fixed" ? "in_stock" : "beyond_repair"
    await inventoryCollection.updateOne({ _id: repair.itemId }, { $set: { status: itemStatus, updatedAt: new Date() } })

    await ticketCollection.updateOne(
      { _id: repair.ticketId },
      { $set: { status: "resolved", resolvedAt: new Date(), updatedAt: new Date() } },
    )

    revalidatePath("/repairs")
    revalidatePath("/inventory")
    revalidatePath("/tickets")
    return { success: true }
  } catch (error) {
    console.error("Error completing repair:", error)
    return { success: false, error: "Failed to complete repair" }
  }
}

export async function markReturnedToUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase()
    const repairCollection = db.collection<RepairRecord>("repairs")
    const ticketCollection = db.collection<Ticket>("tickets")

    const repair = await repairCollection.findOne({ _id: new ObjectId(id) })
    if (!repair) {
      return { success: false, error: "Repair record not found" }
    }

    await repairCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { returnedToUser: true, returnedAt: new Date(), updatedAt: new Date() } },
    )

    await ticketCollection.updateOne(
      { _id: repair.ticketId },
      { $set: { status: "closed", closedAt: new Date(), updatedAt: new Date() } },
    )

    revalidatePath("/repairs")
    revalidatePath("/tickets")
    return { success: true }
  } catch (error) {
    console.error("Error marking as returned:", error)
    return { success: false, error: "Failed to mark as returned" }
  }
}

export async function getRepairs(filters?: {
  outcome?: RepairOutcome
  search?: string
}): Promise<RepairRecord[]> {
  try {
    const db = await getDatabase()
    const collection = db.collection<RepairRecord>("repairs")

    const query: Record<string, unknown> = {}

    if (filters?.outcome) {
      query.outcome = filters.outcome
    }

    if (filters?.search) {
      query.$or = [
        { ticketNumber: { $regex: filters.search, $options: "i" } },
        { itemBarcode: { $regex: filters.search, $options: "i" } },
        { itemName: { $regex: filters.search, $options: "i" } },
        { technicianName: { $regex: filters.search, $options: "i" } },
      ]
    }

    const repairs = await collection.find(query).sort({ createdAt: -1 }).toArray()
    return JSON.parse(JSON.stringify(repairs))
  } catch (error) {
    console.error("Error fetching repairs:", error)
    return []
  }
}

export async function getRepairById(id: string): Promise<RepairRecord | null> {
  try {
    const db = await getDatabase()
    const collection = db.collection<RepairRecord>("repairs")
    const repair = await collection.findOne({ _id: new ObjectId(id) })
    return repair ? JSON.parse(JSON.stringify(repair)) : null
  } catch (error) {
    console.error("Error fetching repair:", error)
    return null
  }
}

export async function getRepairByTicket(ticketId: string): Promise<RepairRecord | null> {
  try {
    const db = await getDatabase()
    const collection = db.collection<RepairRecord>("repairs")
    const repair = await collection.findOne({ ticketId: new ObjectId(ticketId) })
    return repair ? JSON.parse(JSON.stringify(repair)) : null
  } catch (error) {
    console.error("Error fetching repair:", error)
    return null
  }
}

export async function getRepairStats() {
  try {
    const db = await getDatabase()
    const collection = db.collection<RepairRecord>("repairs")

    const [total, pending, fixed, beyondRepair] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ outcome: "pending" }),
      collection.countDocuments({ outcome: "fixed" }),
      collection.countDocuments({ outcome: "beyond_repair" }),
    ])

    return { total, pending, fixed, beyondRepair }
  } catch (error) {
    console.error("Error fetching repair stats:", error)
    return { total: 0, pending: 0, fixed: 0, beyondRepair: 0 }
  }
}
