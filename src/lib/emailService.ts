import sgMail from "@sendgrid/mail";
import { getGeminiModel } from "./gemini";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@yourapp.com";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Product Assistant";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface ProductEmailData {
  productName: string;
  category: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  reviews: Array<{
    rating: number;
    review_content: string;
    sentiment?: string;
  }>;
  productUrl?: string;
}

export interface EmailGenerationResult {
  subject: string;
  htmlContent: string;
  textContent: string;
  overallRating: number;
  ratingExplanation: string;
}

async function generateOverallRating(
  reviews: ProductEmailData["reviews"]
): Promise<{ rating: number; explanation: string }> {
  try {
    const model = getGeminiModel();

    const prompt = `Analyze these product reviews and calculate an overall rating out of 5.0.

Reviews:
${reviews
  .map(
    (r, i) =>
      `${i + 1}. Rating: ${r.rating}/5 - "${r.review_content}" ${
        r.sentiment ? `[Sentiment: ${r.sentiment}]` : ""
      }`
  )
  .join("\n")}

Provide a JSON response with:
{
  "overallRating": <number between 1.0 and 5.0>,
  "explanation": "<brief 2-3 sentence explanation of why you gave this rating, considering both positive and negative aspects>"
}

Be fair and balanced. Consider review sentiments, specific ratings, and overall feedback.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        rating: Math.max(1.0, Math.min(5.0, parseFloat(parsed.overallRating))),
        explanation: parsed.explanation,
      };
    }

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return {
      rating: Math.round(avgRating * 10) / 10,
      explanation:
        "Based on customer reviews, this product has received mixed feedback.",
    };
  } catch (error) {
    console.error("Error generating rating:", error);
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return {
      rating: Math.round(avgRating * 10) / 10,
      explanation: "Rating calculated from customer reviews.",
    };
  }
}

export async function generateProductEmail(
  productData: ProductEmailData
): Promise<EmailGenerationResult> {
  try {
    const { rating, explanation } = await generateOverallRating(
      productData.reviews
    );

    const model = getGeminiModel();

    const prompt = `Create a beautiful, professional product email for the following product.

Product Details:
- Name: ${productData.productName}
- Category: ${productData.category}
- Price: ₹${productData.price}${
      productData.discountPrice
        ? ` (Discounted from ₹${productData.discountPrice})`
        : ""
    }
- Overall Rating: ${rating}/5.0
- Rating Explanation: ${explanation}
- Number of Reviews: ${productData.reviews.length}
- Product URL: ${productData.productUrl || "#"}

Top Reviews:
${productData.reviews
  .slice(0, 5)
  .map(
    (r, i) =>
      `${i + 1}. ${r.rating}/5 - "${r.review_content}" ${
        r.sentiment ? `[${r.sentiment}]` : ""
      }`
  )
  .join("\n")}

Generate:
1. An engaging email subject line
2. Professional HTML email content with:
   - Eye-catching header
   - Product details in a clean format
   - Overall rating with star emojis (⭐)
   - Rating explanation
   - Top 3-5 review highlights
   - A prominent "Shop Now" button that links to the product URL
     * Button style: background #4F46E5 (indigo), white text, rounded corners, padding 12px 32px
     * Center-aligned, placed after reviews section
     * Link to: ${productData.productUrl || "#"}
   - Professional closing
   - Footer with: "© 2025 Bert5. Your AI-powered shopping assistant."
3. Plain text version (no HTML tags, include product URL as plain text)

IMPORTANT BRANDING GUIDELINES:
- The email is sent by "Bert5" - an AI-powered shopping assistant platform
- Footer MUST say: "© 2025 Bert5" (NOT the product brand name)
- Any company references should be to "Bert5", not the product manufacturer
- Keep the product brand name only in product details, not in footer or company info

Respond in JSON format:
{
  "subject": "...",
  "htmlContent": "...",
  "textContent": "..."
}

Make it visually appealing, use emojis appropriately, and keep it professional but friendly.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      subject: parsed.subject,
      htmlContent: parsed.htmlContent,
      textContent: parsed.textContent,
      overallRating: rating,
      ratingExplanation: explanation,
    };
  } catch (error) {
    console.error("Error generating email:", error);

    const avgRating =
      productData.reviews.reduce((sum, r) => sum + r.rating, 0) /
      productData.reviews.length;
    const rating = Math.round(avgRating * 10) / 10;
    const stars = "⭐".repeat(Math.round(rating));

    const subject = `${productData.productName} - ${rating}/5 ${stars}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 3px solid #4F46E5; padding-bottom: 10px;">
          ${productData.productName}
        </h1>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4F46E5; margin-top: 0;">Product Details</h2>
          <p><strong>Category:</strong> ${productData.category}</p>
          <p><strong>Price:</strong> ₹${productData.price}</p>
          <p><strong>Overall Rating:</strong> ${rating}/5.0 ${stars}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Customer Reviews (${
            productData.reviews.length
          } total)</h3>
          ${productData.reviews
            .slice(0, 3)
            .map(
              (r) => `
            <div style="border-left: 3px solid #4F46E5; padding-left: 15px; margin: 10px 0;">
              <p style="margin: 5px 0;"><strong>${r.rating}/5</strong> - ${r.review_content}</p>
            </div>
          `
            )
            .join("")}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${productData.productUrl || "#"}" 
             style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            🛒 Shop Now
          </a>
        </div>

        <p style="color: #666; margin-top: 30px;">
          This email was generated based on customer reviews and ratings.
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 14px;">
          <p style="margin: 5px 0;">© 2025 Bert5</p>
          <p style="margin: 5px 0;">Your AI-powered shopping assistant</p>
        </div>
      </div>
    `;

    const textContent = `
${productData.productName}
${"=".repeat(productData.productName.length)}

Category: ${productData.category}
Price: ₹${productData.price}
Overall Rating: ${rating}/5.0 ${stars}

Customer Reviews (${productData.reviews.length} total):
${productData.reviews
  .slice(0, 3)
  .map((r, i) => `${i + 1}. ${r.rating}/5 - ${r.review_content}`)
  .join("\n")}

🛒 Shop Now: ${productData.productUrl || "Product link not available"}

---
This email was generated based on customer reviews and ratings.

© 2025 ShopSense
Your AI-powered shopping assistant
    `.trim();

    return {
      subject,
      htmlContent,
      textContent,
      overallRating: rating,
      ratingExplanation: "Based on customer reviews.",
    };
  }
}

export async function sendProductEmail(
  recipientEmail: string,
  recipientName: string,
  emailContent: EmailGenerationResult
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error("[Email] SENDGRID_API_KEY is not configured");
      return {
        success: false,
        error:
          "Email service not configured. Please add SENDGRID_API_KEY to your .env file.",
      };
    }

    console.log(`[Email] Attempting to send email to: ${recipientEmail}`);
    console.log(`[Email] Subject: ${emailContent.subject}`);

    const msg = {
      to: {
        email: recipientEmail,
        name: recipientName,
      },
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: emailContent.subject,
      text: emailContent.textContent,
      html: emailContent.htmlContent,
    };

    const [response] = await sgMail.send(msg);

    console.log(
      `[Email] Successfully sent email. Status: ${response.statusCode}`
    );
    console.log(`[Email] Message ID: ${response.headers["x-message-id"]}`);

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error: unknown) {
    console.error("[Email] Error sending email:", error);

    if (error instanceof Error) {
      console.error("[Email] Error message:", error.message);
    }

    if (typeof error === "object" && error !== null && "response" in error) {
      const sgError = error as { response?: { body?: unknown } };
      console.error("[Email] SendGrid error details:", sgError.response?.body);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export async function generateAndSendProductEmail(
  recipientEmail: string,
  recipientName: string,
  productData: ProductEmailData
): Promise<{
  success: boolean;
  emailContent?: EmailGenerationResult;
  error?: string;
}> {
  try {
    const emailContent = await generateProductEmail(productData);

    const sendResult = await sendProductEmail(
      recipientEmail,
      recipientName,
      emailContent
    );

    if (!sendResult.success) {
      return {
        success: false,
        error: sendResult.error,
      };
    }

    return {
      success: true,
      emailContent,
    };
  } catch (error: unknown) {
    console.error("Error in generateAndSendProductEmail:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate and send email",
    };
  }
}
