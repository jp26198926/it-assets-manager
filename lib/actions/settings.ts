"use server";

import { getDatabase } from "@/lib/mongodb";
import type { AppSettings, AppSettingsSerialized } from "@/lib/models/types";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth";
import { hasPermission } from "../models/User";
import { sendEmail, generateEmailTemplate } from "@/lib/utils/email";

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
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "update")) {
      return { success: false, error: "Unauthorized" };
    }

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
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "update")) {
      return { success: false, error: "Unauthorized" };
    }

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
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "update")) {
      return { success: false, error: "Unauthorized" };
    }

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

export async function sendTestEmail(
  recipientEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "update")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<AppSettings>("settings");
    const settings = await collection.findOne({});

    if (!settings) {
      return { success: false, error: "Email settings not configured" };
    }

    // Check if email is configured
    const isConfigured =
      settings.emailProvider === "smtp"
        ? !!(settings.smtpHost && settings.smtpUser && settings.smtpPassword)
        : !!(settings.emailApiKey && settings.emailApiEndpoint);

    if (!isConfigured) {
      return {
        success: false,
        error: "Email not configured. Please complete the configuration first.",
      };
    }

    const companyName = settings.companyName || "IT Support System";
    const content = `
      <h2>Email Configuration Test</h2>
      <p>This is a test email from your ticketing system.</p>
      
      <div class="info-box">
        <strong>Email Provider:</strong>
        ${settings.emailProvider.toUpperCase()}
      </div>

      <div class="info-box">
        <strong>Sent to:</strong>
        ${recipientEmail}
      </div>

      <div class="info-box">
        <strong>Sent by:</strong>
        ${user.name} (${user.email})
      </div>

      <div class="info-box">
        <strong>Time:</strong>
        ${new Date().toLocaleString()}
      </div>

      <p style="margin-top: 30px; color: #22c55e; font-weight: 600;">
        ✓ If you received this email, your email configuration is working correctly!
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        You can now receive notifications for ticket updates, assignments, and other system events.
      </p>
    `;

    console.log("Generating email template...");
    const html = await generateEmailTemplate(companyName, content);

    console.log("Sending test email to:", recipientEmail);
    console.log("Using provider:", settings.emailProvider);

    const emailSent = await sendEmail({
      to: recipientEmail,
      subject: `Test Email - ${companyName}`,
      html,
    });

    if (!emailSent) {
      console.error("Email send returned false");
      return {
        success: false,
        error:
          "Failed to send test email. Please check your email configuration (SMTP host, credentials, ports) and server console for detailed errors.",
      };
    }

    console.log("Test email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending test email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to send test email: ${errorMessage}`,
    };
  }
}
