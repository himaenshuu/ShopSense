/**
 * AI Chat API Route with Google Gemini Integration + Product Data
 *
 * This Next.js API route handles AI chat completions using Google's Gemini AI
 * with streaming support for real-time responses. It also integrates with our
 * Amazon product database to provide data-driven responses for product queries.
 */

import { NextRequest } from "next/server";
import {
  generateStreamingResponse,
  cleanMarkdownFormatting,
} from "@/lib/gemini";
import { classifyIntent } from "@/lib/intentClassifier";
import { productService } from "@/lib/productService";
import {
  analyzeBatchSentiments,
  getSentimentStats,
} from "@/lib/sentimentAnalyzer";

// Consistent streaming configuration
const STREAMING_CONFIG = {
  CHARS_PER_CHUNK: 3, // Number of characters to send per chunk
  DELAY_MS: 20, // Delay between chunks in milliseconds
};

/**
 * Enhance user message with product data if query requires it
 */
async function enhanceMessageWithProductData(message: string): Promise<string> {
  // Classify the intent
  const classification = classifyIntent(message);
  const { intent, requiresData, extractedEntities } = classification;

  console.log(
    `[Intent] ${intent} (${Math.round(
      classification.confidence * 100
    )}% confident)`
  );

  // If no data required, add system instruction for concise responses
  if (!requiresData) {
    return `${message}\n\nIMPORTANT: Always give short and clear responses. Avoid lengthy explanations unless specifically asked. Be concise and to the point.`;
  }

  let enhancedPrompt = message;
  let productData = "";

  try {
    // Handle different intent types
    if (intent === "product_price") {
      const productName = extractedEntities.productName || message;
      const priceInfoList = await productService.getProductPrice(productName);

      if (priceInfoList && priceInfoList.length > 0) {
        productData = "\n\n[PRODUCT DATA]\n";
        priceInfoList.slice(0, 3).forEach((p) => {
          productData += `- ${p.product_name}: ${p.discounted_price} (was ${p.actual_price}, save ${p.savings})\n`;
        });
        console.log(
          `[Data] Found ${priceInfoList.length} products for pricing`
        );
      }
    } else if (intent === "product_reviews") {
      const productName = extractedEntities.productName || message;
      const limit = extractedEntities.limit || 5;
      const reviews = await productService.getTopReviews(productName, limit);

      if (reviews && reviews.length > 0) {
        // Analyze sentiment
        const reviewTexts = reviews.map((r) => r.review_content);
        const sentiments = await analyzeBatchSentiments(reviewTexts);
        const stats = getSentimentStats(sentiments);

        productData = "\n\n[PRODUCT REVIEWS]\n";
        productData += `Sentiment Analysis: ${stats.positivePercent}% positive, ${stats.negativePercent}% negative, ${stats.neutralPercent}% neutral\n\n`;

        reviews.slice(0, limit).forEach((review, i) => {
          const sentiment = sentiments[i];
          const emoji =
            sentiment.label === "positive"
              ? "😊"
              : sentiment.label === "negative"
              ? "😞"
              : "😐";
          productData += `${i + 1}. ${emoji} "${review.review_title}"\n`;
          productData += `   ${review.review_content.substring(0, 200)}${
            review.review_content.length > 200 ? "..." : ""
          }\n`;
          productData += `   - ${review.user_name}\n\n`;
        });
        console.log(
          `[Data] Found ${reviews.length} reviews with sentiment analysis`
        );
      }
    } else if (intent === "product_search") {
      const searchTerm = extractedEntities.productName || message;
      const limit = extractedEntities.limit || 10;
      const priceRange = extractedEntities.priceRange;

      let products;
      if (priceRange) {
        products = await productService.getProductsByPriceRange(
          priceRange.min,
          priceRange.max,
          limit
        );
      } else {
        products = await productService.getTopRatedProducts(searchTerm, limit);
      }

      if (products && products.length > 0) {
        productData = "\n\n[PRODUCT SEARCH RESULTS]\n";
        products.forEach((p, i) => {
          const price =
            typeof p.discounted_price === "string"
              ? p.discounted_price
              : `₹${p.discounted_price}`;
          productData += `${i + 1}. ${p.product_name}\n`;
          productData += `   Price: ${price} | Rating: ${p.rating}/5 (${p.rating_count} reviews)\n`;
        });
        console.log(`[Data] Found ${products.length} products in search`);
      }
    } else if (intent === "product_info") {
      const productName = extractedEntities.productName || message;
      const products = await productService.searchProducts(productName, 3);

      if (products && products.length > 0) {
        const topProduct = products[0];
        productData = "\n\n[PRODUCT INFORMATION]\n";
        const price =
          typeof topProduct.discounted_price === "string"
            ? topProduct.discounted_price
            : `₹${topProduct.discounted_price}`;
        productData += `Product: ${topProduct.product_name}\n`;
        productData += `Price: ${price}\n`;
        productData += `Rating: ${topProduct.rating}/5 (${topProduct.rating_count} reviews)\n`;
        productData += `Category: ${topProduct.category}\n`;

        // Add some reviews for context
        const reviewResult = await productService.getProductReviews(
          productName,
          3
        );
        if (reviewResult && reviewResult.reviews.length > 0) {
          productData += "\nTop Reviews:\n";
          reviewResult.reviews.forEach((r, i) => {
            productData += `${i + 1}. ${
              r.review_title
            }: "${r.review_content.substring(0, 100)}..."\n`;
          });
        }
        console.log(`[Data] Found product info for ${topProduct.product_name}`);
      }
    } else if (intent === "product_comparison") {
      const productName = extractedEntities.productName || message;
      const stats = await productService.getProductStats(productName);

      if (stats) {
        productData = "\n\n[PRODUCT STATISTICS]\n";
        productData += `Total Products: ${stats.totalProducts}\n`;
        productData += `Average Price: ${stats.avgPrice}\n`;
        productData += `Price Range: ${stats.minPrice} - ${stats.maxPrice}\n`;
        productData += `Average Rating: ${stats.avgRating}/5\n`;
        productData += `Total Reviews: ${stats.totalReviews.toLocaleString()}\n`;
        console.log(`[Data] Found stats for ${productName} category`);
      }
    } else if (intent === "email_request") {
      // Special handling for email requests - extract product from context or message
      let productName = extractedEntities.productName;

      // If product name is generic ("this product", "it", etc.), look in conversation history
      if (!productName || productName.match(/^(this|that|it|the product)$/i)) {
        productName = undefined;
      }

      return JSON.stringify({
        type: "email_request",
        productName: productName || "the product we discussed",
        needsContext: !productName,
        message:
          "I'll help you generate an email with product details. Let me fetch the information first.",
      });
    }

    // Combine original message with product data
    if (productData) {
      enhancedPrompt = `${message}${productData}\n\nIMPORTANT: Always give short and clear responses. Avoid lengthy explanations unless specifically asked. Be concise and to the point. Use bullet points when listing multiple items. Keep explanations brief (1-2 sentences maximum unless user asks for details).

Please provide a helpful response based on the product data above. Format your response clearly with proper markdown formatting. Include specific product details and prices when relevant.`;
    }
  } catch (error) {
    console.error(
      "[Data Error]",
      error instanceof Error ? error.message : String(error)
    );
    // If data fetching fails, continue with original message
  }

  return enhancedPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_TOKEN) {
      console.error("GEMINI_API_TOKEN is not configured");
      return new Response(
        JSON.stringify({
          error: "AI service not configured",
          details: "GEMINI_API_TOKEN environment variable is missing",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      "Generating response for message:",
      message.substring(0, 50) + "..."
    );

    // Enhance message with product data if applicable
    const enhancedMessage = await enhanceMessageWithProductData(message);

    // Check if it's an email request (returns JSON string)
    if (enhancedMessage.startsWith('{"type":"email_request"')) {
      console.log("[EMAIL] Detected email request, returning JSON response");
      const emailRequestData = JSON.parse(enhancedMessage);
      return new Response(JSON.stringify(emailRequestData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const isEnhanced = enhancedMessage !== message;

    if (isEnhanced) {
      console.log("[Enhanced] Message enhanced with product data");
    }

    // Create streaming response with Gemini (using enhanced message)
    const stream = await generateStreamingResponse(
      enhancedMessage,
      conversationHistory
    );

    // Create a readable stream for the response with consistent speed
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";

          // Collect full response first
          for await (const chunk of stream) {
            fullResponse += chunk.text();
          }

          // Clean markdown formatting
          fullResponse = cleanMarkdownFormatting(fullResponse);

          // Stream with consistent speed
          for (
            let i = 0;
            i < fullResponse.length;
            i += STREAMING_CONFIG.CHARS_PER_CHUNK
          ) {
            const chunk = fullResponse.slice(
              i,
              i + STREAMING_CONFIG.CHARS_PER_CHUNK
            );
            controller.enqueue(encoder.encode(chunk));

            // Add delay for consistent streaming speed
            if (i + STREAMING_CONFIG.CHARS_PER_CHUNK < fullResponse.length) {
              await new Promise((resolve) =>
                setTimeout(resolve, STREAMING_CONFIG.DELAY_MS)
              );
            }
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          controller.enqueue(encoder.encode(`\n\n[Error: ${errorMessage}]`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Full error:", errorMessage);

    return new Response(
      JSON.stringify({
        error: "Failed to process chat message",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
