"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type {
  InventoryItem,
  InventoryItemWithCategory,
  InventoryItemWithCategorySerialized,
  ItemStatus,
} from "@/lib/models/types";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth";
import { hasPermission } from "../models/User";

function generateBarcode(): string {
  const prefix = "IT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function createInventoryItem(data: {
  name: string;
  description?: string;
  categoryId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
}): Promise<{ success: boolean; item?: InventoryItem; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "inventory", "create")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<InventoryItem>("inventory");

    // Validate category exists
    const categoryExists = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(data.categoryId) });
    if (!categoryExists) {
      return { success: false, error: "Selected category does not exist" };
    }

    const barcode = generateBarcode();

    const item: InventoryItem = {
      barcode,
      name: data.name,
      description: data.description,
      categoryId: new ObjectId(data.categoryId),
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      status: "in_stock",
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchasePrice: data.purchasePrice,
      warrantyExpiry: data.warrantyExpiry
        ? new Date(data.warrantyExpiry)
        : undefined,
      location: data.location,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(item);
    item._id = result.insertedId;

    revalidatePath("/inventory");
    return { success: true, item };
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return { success: false, error: "Failed to create inventory item" };
  }
}

export async function getInventoryItems(filters?: {
  status?: ItemStatus;
  categoryId?: string;
  search?: string;
}): Promise<InventoryItemWithCategorySerialized[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<InventoryItem>("inventory");

    const matchStage: Record<string, unknown> = {};

    if (filters?.status) {
      matchStage.status = filters.status;
    }

    if (filters?.categoryId) {
      matchStage.categoryId = new ObjectId(filters.categoryId);
    }

    if (filters?.search) {
      matchStage.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { barcode: { $regex: filters.search, $options: "i" } },
        { serialNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    const pipeline: any[] = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $unwind: {
          path: "$categoryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          barcode: 1,
          name: 1,
          description: 1,
          categoryId: 1,
          brand: 1,
          model: 1,
          serialNumber: 1,
          status: 1,
          purchaseDate: 1,
          purchasePrice: 1,
          warrantyExpiry: 1,
          location: 1,
          notes: 1,
          createdAt: 1,
          updatedAt: 1,
          category: {
            _id: "$categoryData._id",
            name: "$categoryData.name",
            code: "$categoryData.code",
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const items = await collection
      .aggregate<InventoryItemWithCategory>(pipeline)
      .toArray();

    // Serialize for client components
    const serialized: InventoryItemWithCategorySerialized[] = items.map(
      (item) => ({
        _id: item._id?.toString(),
        barcode: item.barcode,
        name: item.name,
        description: item.description,
        categoryId: item.categoryId?.toString() || "",
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        status: item.status,
        purchaseDate: item.purchaseDate?.toISOString(),
        purchasePrice: item.purchasePrice,
        warrantyExpiry: item.warrantyExpiry?.toISOString(),
        location: item.location,
        notes: item.notes,
        createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: item.updatedAt?.toISOString() || new Date().toISOString(),
        category:
          item.category && item.category._id
            ? {
                _id: item.category._id.toString(),
                name: item.category.name,
                code: item.category.code,
              }
            : {
                _id: "",
                name: "Unknown",
                code: "UNKNOWN",
              },
      }),
    );

    return serialized;
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return [];
  }
}

export async function getInventoryItemByBarcode(
  barcode: string,
): Promise<InventoryItem | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<InventoryItem>("inventory");
    const item = await collection.findOne({ barcode });
    return item ? JSON.parse(JSON.stringify(item)) : null;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return null;
  }
}

export async function getInventoryItemById(
  id: string,
): Promise<InventoryItemWithCategorySerialized | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<InventoryItem>("inventory");

    const pipeline: any[] = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $unwind: {
          path: "$categoryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          barcode: 1,
          name: 1,
          description: 1,
          categoryId: 1,
          brand: 1,
          model: 1,
          serialNumber: 1,
          status: 1,
          purchaseDate: 1,
          purchasePrice: 1,
          warrantyExpiry: 1,
          location: 1,
          notes: 1,
          createdAt: 1,
          updatedAt: 1,
          category: {
            _id: "$categoryData._id",
            name: "$categoryData.name",
            code: "$categoryData.code",
          },
        },
      },
    ];

    const items = await collection
      .aggregate<InventoryItemWithCategory>(pipeline)
      .toArray();
    const item = items[0];

    if (!item) return null;

    // Serialize for client components
    const serialized: InventoryItemWithCategorySerialized = {
      _id: item._id?.toString(),
      barcode: item.barcode,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId?.toString() || "",
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      status: item.status,
      purchaseDate: item.purchaseDate?.toISOString(),
      purchasePrice: item.purchasePrice,
      warrantyExpiry: item.warrantyExpiry?.toISOString(),
      location: item.location,
      notes: item.notes,
      createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: item.updatedAt?.toISOString() || new Date().toISOString(),
      category:
        item.category && item.category._id
          ? {
              _id: item.category._id.toString(),
              name: item.category.name,
              code: item.category.code,
            }
          : {
              _id: "",
              name: "Unknown",
              code: "UNKNOWN",
            },
    };

    return serialized;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return null;
  }
}

export async function updateInventoryItem(
  id: string,
  data: {
    name?: string;
    description?: string;
    categoryId?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    status?: ItemStatus;
    purchaseDate?: string;
    purchasePrice?: number;
    warrantyExpiry?: string;
    location?: string;
    notes?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "inventory", "update")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<InventoryItem>("inventory");

    // Check if item exists
    const existingItem = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingItem) {
      return { success: false, error: "Inventory item not found" };
    }

    // If categoryId is being updated, validate it exists
    if (data.categoryId) {
      const categoryExists = await db
        .collection("categories")
        .findOne({ _id: new ObjectId(data.categoryId) });
      if (!categoryExists) {
        return { success: false, error: "Selected category does not exist" };
      }
    }

    // Prepare update data with proper types
    const updateData: Partial<InventoryItem> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.categoryId !== undefined)
      updateData.categoryId = new ObjectId(data.categoryId);
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.serialNumber !== undefined)
      updateData.serialNumber = data.serialNumber;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.purchaseDate !== undefined)
      updateData.purchaseDate = data.purchaseDate
        ? new Date(data.purchaseDate)
        : undefined;
    if (data.purchasePrice !== undefined)
      updateData.purchasePrice = data.purchasePrice;
    if (data.warrantyExpiry !== undefined)
      updateData.warrantyExpiry = data.warrantyExpiry
        ? new Date(data.warrantyExpiry)
        : undefined;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return { success: false, error: "Failed to update inventory item" };
  }
}

export async function updateItemStatus(
  id: string,
  status: ItemStatus,
): Promise<{ success: boolean; error?: string }> {
  return updateInventoryItem(id, { status });
}

export async function deleteInventoryItem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "inventory", "delete")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<InventoryItem>("inventory");

    // Check if item exists
    const existingItem = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingItem) {
      return { success: false, error: "Inventory item not found" };
    }

    // Soft delete by setting status to disposed
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "disposed" as ItemStatus, updatedAt: new Date() } },
    );

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return { success: false, error: "Failed to delete inventory item" };
  }
}

export async function getInventoryStats() {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "inventory", "read")) {
      return {
        total: 0,
        inStock: 0,
        issued: 0,
        underRepair: 0,
        beyondRepair: 0,
      };
    }

    const db = await getDatabase();
    const collection = db.collection<InventoryItem>("inventory");

    const [total, inStock, issued, underRepair, beyondRepair] =
      await Promise.all([
        collection.countDocuments(),
        collection.countDocuments({ status: "in_stock" }),
        collection.countDocuments({ status: "issued" }),
        collection.countDocuments({ status: "under_repair" }),
        collection.countDocuments({ status: "beyond_repair" }),
      ]);

    return { total, inStock, issued, underRepair, beyondRepair };
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return { total: 0, inStock: 0, issued: 0, underRepair: 0, beyondRepair: 0 };
  }
}
