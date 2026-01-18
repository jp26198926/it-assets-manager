"use server";

import nodemailer from "nodemailer";
import { getDatabase } from "@/lib/mongodb";
import type { AppSettings, EmailProvider } from "@/lib/models/types";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Get email configuration from settings
 */
async function getEmailConfig(): Promise<AppSettings | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AppSettings>("settings");
    const settings = await collection.findOne({});
    return settings;
  } catch (error) {
    console.error("Error fetching email config:", error);
    return null;
  }
}

/**
 * Send email using SMTP
 */
async function sendViaSMTP(
  settings: AppSettings,
  options: EmailOptions,
): Promise<boolean> {
  try {
    if (
      !settings.smtpHost ||
      !settings.smtpPort ||
      !settings.smtpUser ||
      !settings.smtpPassword
    ) {
      console.error("SMTP configuration incomplete:", {
        hasHost: !!settings.smtpHost,
        hasPort: !!settings.smtpPort,
        hasUser: !!settings.smtpUser,
        hasPassword: !!settings.smtpPassword,
      });
      return false;
    }

    console.log("Creating SMTP transporter:", {
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      user: settings.smtpUser,
    });

    // Port 465 uses SSL (secure: true)
    // Port 587 uses TLS/STARTTLS (secure: false)
    const isSSL = settings.smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: isSSL, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
      ...(settings.smtpPort === 587 && {
        requireTLS: true,
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false, // For development; set to true in production
        },
      }),
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      throw verifyError;
    }

    const recipients = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;

    console.log("Sending email to:", recipients);

    const info = await transporter.sendMail({
      from: settings.smtpUser,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("SMTP send error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}

/**
 * Send email using API
 */
async function sendViaAPI(
  settings: AppSettings,
  options: EmailOptions,
): Promise<boolean> {
  try {
    if (!settings.emailApiKey || !settings.emailApiEndpoint) {
      console.error("Email API configuration incomplete:", {
        hasApiKey: !!settings.emailApiKey,
        hasEndpoint: !!settings.emailApiEndpoint,
      });
      return false;
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    console.log("Sending via API to:", settings.emailApiEndpoint);
    console.log("Recipients:", recipients);

    const response = await fetch(settings.emailApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.emailApiKey}`,
      },
      body: JSON.stringify({
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API send error - Status:", response.status);
      console.error("API send error - Response:", errorText);
      return false;
    }

    console.log("Email sent successfully via API");
    return true;
  } catch (error) {
    console.error("API send error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return false;
  }
}

/**
 * Main function to send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const settings = await getEmailConfig();

    if (!settings) {
      console.error("Email settings not found");
      return false;
    }

    // Check if email is configured
    const isConfigured =
      settings.emailProvider === "smtp"
        ? !!(settings.smtpHost && settings.smtpUser && settings.smtpPassword)
        : !!(settings.emailApiKey && settings.emailApiEndpoint);

    if (!isConfigured) {
      console.warn("Email not configured, skipping notification");
      return false;
    }

    // Send based on provider
    if (settings.emailProvider === "smtp") {
      return await sendViaSMTP(settings, options);
    } else if (settings.emailProvider === "api") {
      return await sendViaAPI(settings, options);
    }

    return false;
  } catch (error) {
    console.error("Send email error:", error);
    return false;
  }
}

/**
 * Generate email template wrapper
 */
export async function generateEmailTemplate(
  companyName: string,
  content: string,
): Promise<string> {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
          }
          .content {
            margin-bottom: 30px;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 0;
          }
          .info-box {
            background-color: #f3f4f6;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 15px 0;
          }
          .info-box strong {
            display: block;
            margin-bottom: 5px;
            color: #1f2937;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>This is an automated message from ${companyName}. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
