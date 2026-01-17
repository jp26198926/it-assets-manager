"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { Category, CategorySerialized } from "@/lib/models/types";
import { revalidatePath } from "next/cache";

export async function createCategory(data: {
  name: string;
  code: string;
  description?: string;
}): Promise<{ success: boolean; category?: any; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Category>("categories");

    // Check if code already exists
    const existingCategory = await collection.findOne({ code: data.code });
    if (existingCategory) {
      return { success: false, error: "Category code already exists" };
    }

    const category: Category = {
      name: data.name,
      code: data.code,
      description: data.description,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(category);
    category._id = result.insertedId;

    // Serialize the category data
    const serializedCategory = {
      _id: category._id.toString(),
      name: category.name,
      code: category.code,
      description: category.description,
      createdAt: category.createdAt.toISOString(),
    };

    revalidatePath("/categories");
    return { success: true, category: serializedCategory };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function getCategories(): Promise<{
  success: boolean;
  data?: CategorySerialized[];
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Category>("categories");
    const categories = await collection.find().sort({ name: 1 }).toArray();

    // Serialize the categories
    const serialized: CategorySerialized[] = categories.map((cat) => ({
      _id: cat._id!.toString(),
      name: cat.name,
      code: cat.code,
      description: cat.description,
      createdAt: cat.createdAt.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Category>("categories");
    const category = await collection.findOne({ _id: new ObjectId(id) });
    return category ? JSON.parse(JSON.stringify(category)) : null;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
  }
): Promise<{ success: boolean; category?: any; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Category>("categories");

    // If updating code, check if it already exists (excluding current category)
    if (data.code) {
      const existingCategory = await collection.findOne({
        code: data.code,
        _id: { $ne: new ObjectId(id) },
      });
      if (existingCategory) {
        return { success: false, error: "Category code already exists" };
      }
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: "after" }
    );

    if (!result) {
      return { success: false, error: "Category not found" };
    }

    // Serialize the category
    const serializedCategory = {
      _id: result._id!.toString(),
      name: result.name,
      code: result.code,
      description: result.description,
      createdAt: result.createdAt.toISOString(),
    };

    revalidatePath("/categories");
    return { success: true, category: serializedCategory };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const categoriesCollection = db.collection<Category>("categories");

    // Check if category is in use (check inventory items, tickets, etc.)
    const inventoryCount = await db.collection("inventory").countDocuments({
      category: { $exists: true },
    });

    const ticketsCount = await db.collection("tickets").countDocuments({
      category: id,
    });

    if (inventoryCount > 0 || ticketsCount > 0) {
      return {
        success: false,
        error: "Cannot delete category that is in use by items or tickets",
      };
    }

    const result = await categoriesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return { success: false, error: "Category not found" };
    }

    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
