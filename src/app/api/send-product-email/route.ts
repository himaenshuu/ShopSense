/**
 * API Route: Send Product Email
 * Sends pre-generated email content via SendGrid
 */

import { NextRequest, NextResponse } from "next/server";
import { sendProductEmail, EmailGenerationResult } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientEmail, recipientName, emailContent } = body as {
      recipientEmail: string;
      recipientName: string;
      emailContent: EmailGenerationResult;
    };

    // Validate inputs
    if (!recipientEmail || !recipientName || !emailContent) {
      return NextResponse.json(
        { error: "Recipient email, name, and email content are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send email via SendGrid
    const result = await sendProductEmail(
      recipientEmail,
      recipientName,
      emailContent
    );

    if (!result.success) {
      console.error("[API] Email sending failed:", result.error);

      // Return appropriate status based on error type
      const status = result.error?.includes("not configured") ? 503 : 500;

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          help: result.error?.includes("not configured")
            ? "Please configure SENDGRID_API_KEY in your .env file. Get it from: https://app.sendgrid.com/settings/api_keys"
            : undefined,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "Email sent successfully!",
    });
  } catch (error: unknown) {
    console.error("Error sending product email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}
