"use server"

import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type { InventoryItem, ItemCategory, ItemStatus } from "@/lib/models/types"
import { revalidatePath } from "next/cache"

function generateBarcode(): string {
  const prefix = "IT"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function createInventoryItem(data: {
  name: string
  description?: string
  category: ItemCategory
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchasePrice?: number
  warrantyExpiry?: string
  location?: string
  notes?: string
}): Promise<{ success: boolean; item?: InventoryItem; error?: string }> {
  try {
    const db = await getDatabase()
    const collection = db.collection<InventoryItem>("inventory")

    const barcode = generateBarcode()

    const item: InventoryItem = {
      barcode,
      name: data.name,
      description: data.description,
      category: data.category,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      status: "in_stock",
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchasePrice: data.purchasePrice,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
      location: data.location,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(item)
    item._id = result.insertedId

    revalidatePath("/inventory")
    return { success: true, item }
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return { success: false, error: "Failed to create inventory item" }
  }
}

export async function getInventoryItems(filters?: {
  status?: ItemStatus
  category?: ItemCategory
  search?: string
}): Promise<InventoryItem[]> {
  try {
    const db = await getDatabase()
    const collection = db.collection<InventoryItem>("inventory")

    const query: Record<string, unknown> = {}

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.category) {
      query.category = filters.category
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { barcode: { $regex: filters.search, $options: "i" } },
        { serialNumber: { $regex: filters.search, $options: "i" } },
      ]
    }

    const items = await collection.find(query).sort({ createdAt: -1 }).toArray()
    return JSON.parse(JSON.stringify(items))
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return []
  }
}

export async function getInventoryItemByBarcode(barcode: string): Promise<InventoryItem | null> {
  try {
    const db = await getDatabase()
    const collection = db.collection<InventoryItem>("inventory")
    const item = await collection.findOne({ barcode })
    return item ? JSON.parse(JSON.stringify(item)) : null
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return null
  }
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  try {
    const db = await getDatabase()
    const collection = db.collection<InventoryItem>("inventory")
    const item = await collection.findOne({ _id: new ObjectId(id) })
    return item ? JSON.parse(JSON.stringify(item)) : null
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return null
  }
}

export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase()
    const collection = db.collection<InventoryItem>("inventory")

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: { ...data, updatedAt: new Date() } })

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return { success: false, error: "Failed to update inventory item" }
  }
}

export async function updateItemStatus(id: string, status: ItemStatus): Promise<{ success: boolean; error?: string }> {
  return updateInventoryItem(id, { status })
}

export async function getInventoryStats() {
  try {
    const db = await getDatabase()
    const collection = db.collection<InventoryItem>("inventory")

    const [total, inStock, issued, underRepair, beyondRepair] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: "in_stock" }),
      collection.countDocuments({ status: "issued" }),
      collection.countDocuments({ status: "under_repair" }),
      collection.countDocuments({ status: "beyond_repair" }),
    ])

    return { total, inStock, issued, underRepair, beyondRepair }
  } catch (error) {
    console.error("Error fetching inventory stats:", error)
    return { total: 0, inStock: 0, issued: 0, underRepair: 0, beyondRepair: 0 }
  }
}
