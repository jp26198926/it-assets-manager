"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type {
  Issuance,
  IssuanceSerialized,
  InventoryItem,
} from "@/lib/models/types";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth";
import { hasPermission } from "../models/User";

export async function createIssuance(data: {
  itemId: string;
  issuedToType: "employee" | "department";
  issuedToId: string;
  issuedToName: string;
  issuedBy: string;
  expectedReturn?: string;
  notes?: string;
}): Promise<{ success: boolean; issuance?: Issuance; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "issuance", "create")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const issuanceCollection = db.collection<Issuance>("issuances");
    const inventoryCollection = db.collection<InventoryItem>("inventory");

    const item = await inventoryCollection.findOne({
      _id: new ObjectId(data.itemId),
    });
    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (item.status !== "in_stock") {
      return { success: false, error: "Item is not available for issuance" };
    }

    const issuance: Issuance = {
      itemId: new ObjectId(data.itemId),
      itemBarcode: item.barcode,
      itemName: item.name,
      issuedTo: {
        type: data.issuedToType,
        id: new ObjectId(data.issuedToId),
        name: data.issuedToName,
      },
      issuedBy: data.issuedBy,
      issuedAt: new Date(),
      expectedReturn: data.expectedReturn
        ? new Date(data.expectedReturn)
        : undefined,
      notes: data.notes,
      status: "active",
    };

    const result = await issuanceCollection.insertOne(issuance);
    issuance._id = result.insertedId;

    await inventoryCollection.updateOne(
      { _id: new ObjectId(data.itemId) },
      { $set: { status: "issued", updatedAt: new Date() } },
    );

    revalidatePath("/issuance");
    revalidatePath("/inventory");
    return { success: true, issuance };
  } catch (error) {
    console.error("Error creating issuance:", error);
    return { success: false, error: "Failed to create issuance" };
  }
}

export async function returnItem(
  issuanceId: string,
  data: {
    returnRemarks?: string;
    returnStatus: "good" | "damaged" | "needs_repair" | "beyond_repair";
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "issuance", "update")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const issuanceCollection = db.collection<Issuance>("issuances");
    const inventoryCollection = db.collection<InventoryItem>("inventory");

    const issuance = await issuanceCollection.findOne({
      _id: new ObjectId(issuanceId),
    });
    if (!issuance) {
      return { success: false, error: "Issuance record not found" };
    }

    // Update issuance record with return information
    await issuanceCollection.updateOne(
      { _id: new ObjectId(issuanceId) },
      {
        $set: {
          status: "returned",
          returnedAt: new Date(),
          returnRemarks: data.returnRemarks,
          returnStatus: data.returnStatus,
        },
      },
    );

    // Determine inventory item status based on return status
    let itemStatus: "in_stock" | "under_repair" | "beyond_repair" = "in_stock";
    if (
      data.returnStatus === "needs_repair" ||
      data.returnStatus === "damaged"
    ) {
      itemStatus = "under_repair";
    } else if (data.returnStatus === "beyond_repair") {
      itemStatus = "beyond_repair";
    }

    await inventoryCollection.updateOne(
      { _id: issuance.itemId },
      { $set: { status: itemStatus, updatedAt: new Date() } },
    );

    revalidatePath("/issuance");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error returning item:", error);
    return { success: false, error: "Failed to return item" };
  }
}

export async function getIssuances(filters?: {
  status?: "active" | "returned";
  search?: string;
}): Promise<IssuanceSerialized[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Issuance>("issuances");

    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.search) {
      query.$or = [
        { itemName: { $regex: filters.search, $options: "i" } },
        { itemBarcode: { $regex: filters.search, $options: "i" } },
        { "issuedTo.name": { $regex: filters.search, $options: "i" } },
      ];
    }

    const issuances = await collection
      .find(query)
      .sort({ issuedAt: -1 })
      .toArray();

    // Serialize the data
    return issuances.map((issuance) => ({
      _id: issuance._id!.toString(),
      itemId: issuance.itemId.toString(),
      itemBarcode: issuance.itemBarcode,
      itemName: issuance.itemName,
      issuedTo: {
        type: issuance.issuedTo.type,
        id: issuance.issuedTo.id.toString(),
        name: issuance.issuedTo.name,
      },
      issuedBy: issuance.issuedBy,
      issuedAt: issuance.issuedAt.toISOString(),
      returnedAt: issuance.returnedAt?.toISOString(),
      expectedReturn: issuance.expectedReturn?.toISOString(),
      notes: issuance.notes,
      status: issuance.status,
      returnRemarks: issuance.returnRemarks,
      returnStatus: issuance.returnStatus,
    }));
  } catch (error) {
    console.error("Error fetching issuances:", error);
    return [];
  }
}

export async function getIssuancesByItem(itemId: string): Promise<Issuance[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Issuance>("issuances");
    const issuances = await collection
      .find({ itemId: new ObjectId(itemId) })
      .sort({ issuedAt: -1 })
      .toArray();
    return JSON.parse(JSON.stringify(issuances));
  } catch (error) {
    console.error("Error fetching issuances:", error);
    return [];
  }
}
