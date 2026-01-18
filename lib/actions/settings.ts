"use server";

import { getDatabase } from "@/lib/mongodb";
import type { AppSettings, AppSettingsSerialized } from "@/lib/models/types";
import { revalidatePath } from "next/cache";

// Helper function to serialize settings for client components
function serializeSettings(settings: AppSettings): AppSettingsSerialized {
  return {
    ...settings,
    _id: settings._id?.toString(),
    updatedAt:
      settings.updatedAt?.toISOString?.() ||
      settings.updatedAt?.toString() ||
      new Date().toISOString(),
  };
}

export async function getSettings(): Promise<{
  success: boolean;
  data?: AppSettingsSerialized;
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AppSettings>("settings");

    // Get the first (and should be only) settings document
    let settings = await collection.findOne({});

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings: AppSettings = {
        companyName: "IT Support System",
        companyEmail: "",
        companyPhone: "",
        companyAddress: "",
        themeColor: "blue",
        backgroundColor: "black",
        emailProvider: "smtp",
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        smtpSecure: false,
        emailApiKey: "",
        emailApiEndpoint: "",
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(defaultSettings);
      settings = { ...defaultSettings, _id: result.insertedId };
    }

    return { success: true, data: serializeSettings(settings) };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateCompanyDetails(data: {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLogo?: string;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AppSettings>("settings");

    const updateData = {
      companyName: data.companyName,
      companyEmail: data.companyEmail || "",
      companyPhone: data.companyPhone || "",
      companyAddress: data.companyAddress || "",
      companyLogo: data.companyLogo || "",
      updatedAt: new Date(),
      updatedBy: data.updatedBy,
    };

    // Update or create if doesn't exist
    await collection.updateOne({}, { $set: updateData }, { upsert: true });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating company details:", error);
    return { success: false, error: "Failed to update company details" };
  }
}

export async function updateThemeSettings(data: {
  themeColor?: string;
  backgroundColor?: string;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AppSettings>("settings");

    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: data.updatedBy,
    };

    if (data.themeColor) {
      updateData.themeColor = data.themeColor;
    }

    if (data.backgroundColor) {
      updateData.backgroundColor = data.backgroundColor;
    }

    await collection.updateOne(
      {},
      {
        $set: updateData,
      },
      { upsert: true },
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating theme settings:", error);
    return { success: false, error: "Failed to update theme settings" };
  }
}

export async function updateEmailConfig(data: {
  emailProvider: "smtp" | "api";
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  emailApiKey?: string;
  emailApiEndpoint?: string;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AppSettings>("settings");

    const updateData: any = {
      emailProvider: data.emailProvider,
      updatedAt: new Date(),
      updatedBy: data.updatedBy,
    };

    if (data.emailProvider === "smtp") {
      updateData.smtpHost = data.smtpHost || "";
      updateData.smtpPort = data.smtpPort || 587;
      updateData.smtpUser = data.smtpUser || "";
      updateData.smtpPassword = data.smtpPassword || "";
      updateData.smtpSecure = data.smtpSecure || false;
    } else {
      updateData.emailApiKey = data.emailApiKey || "";
      updateData.emailApiEndpoint = data.emailApiEndpoint || "";
    }

    await collection.updateOne({}, { $set: updateData }, { upsert: true });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating email config:", error);
    return { success: false, error: "Failed to update email configuration" };
  }
}
