/**
 * API Route: Generate Product Email
 * Generates AI-powered email content for products using Gemini
 */

import { NextRequest, NextResponse } from "next/server";
import { generateProductEmail, ProductEmailData } from "@/lib/emailService";
import { productService } from "@/lib/productService";
import { analyzeBatchSentiments } from "@/lib/sentimentAnalyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productData } = body as { productData: Partial<ProductEmailData> };

    // Validate product name
    if (!productData || !productData.productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const productName = productData.productName;

    // Fetch product details from database
    const products = await productService.searchProducts(productName, 1);

    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          error: "Product not found",
          message: `We couldn't find "${productName}" in our database. Please try searching for a similar product or check the product name.`,
        },
        { status: 404 }
      );
    }

    const product = products[0];

    // Validate that the found product is actually relevant to the search
    const productNameLower = product.product_name.toLowerCase();
    const searchTerms = productName.toLowerCase().split(" ");
    const matchCount = searchTerms.filter((term) =>
      productNameLower.includes(term)
    ).length;
    const matchRatio = matchCount / searchTerms.length;

    // If less than 40% of search terms match, the result is likely irrelevant
    if (matchRatio < 0.4) {
      console.warn(
        `[Email API] Low relevance match: searched "${productName}", found "${
          product.product_name
        }" (${(matchRatio * 100).toFixed(0)}% match)`
      );
      return NextResponse.json(
        {
          error: "Product not found",
          message: `We couldn't find an exact match for "${productName}". The closest product we found was "${product.product_name}", but it may not be what you're looking for. Please try a different search term.`,
          suggestion: product.product_name,
        },
        { status: 404 }
      );
    }

    console.log(
      `[Email API] Found relevant product: "${
        product.product_name
      }" for search "${productName}" (${(matchRatio * 100).toFixed(0)}% match)`
    );

    // Fetch reviews - get more than needed to account for duplicates
    const reviewsData = await productService.getProductReviews(productName, 50);
    if (!reviewsData || reviewsData.reviews.length === 0) {
      return NextResponse.json(
        { error: "No reviews found for this product" },
        { status: 404 }
      );
    }

    // Deduplicate reviews by review_id (some products have duplicate reviews in MongoDB)
    const uniqueReviewsMap = new Map();
    reviewsData.reviews.forEach((review) => {
      if (review.review_id && !uniqueReviewsMap.has(review.review_id)) {
        uniqueReviewsMap.set(review.review_id, review);
      }
    });
    const uniqueReviews = Array.from(uniqueReviewsMap.values());

    console.log(
      `[Email API] Found ${reviewsData.reviews.length} total reviews, ${uniqueReviews.length} unique reviews`
    );

    // Pick maximum 6 unique reviews
    const selectedReviews = uniqueReviews.slice(0, 6);

    // Analyze sentiments for each review
    const reviewTexts = selectedReviews.map((r) => r.review_content);
    const sentiments = await analyzeBatchSentiments(reviewTexts);

    // Use Gemini to find individual rating for each review
    const reviewsWithRatings = await Promise.all(
      selectedReviews.map(async (review, i) => {
        try {
          const { getGeminiModel } = await import("@/lib/gemini");
          const model = getGeminiModel();

          const ratingPrompt = `Analyze this product review and determine its rating on a scale of 1.0 to 5.0.

Review: "${review.review_content}"

Consider:
- Positive language = higher rating (4.0-5.0)
- Negative language = lower rating (1.0-2.5)
- Mixed feelings = medium rating (2.5-4.0)

Respond with ONLY a JSON object:
{
  "rating": <number between 1.0 and 5.0>
}`;

          const result = await model.generateContent(ratingPrompt);
          const text = result.response.text();

          // Extract JSON from response
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const rating = Math.max(
              1.0,
              Math.min(5.0, parseFloat(parsed.rating))
            );
            return {
              rating: Math.round(rating * 10) / 10, // Round to 1 decimal
              review_content: review.review_content,
              sentiment: sentiments[i]?.label,
            };
          }
        } catch (error) {
          console.error(`Error getting rating for review ${i}:`, error);
        }

        // Fallback: use sentiment to estimate rating
        const sentiment = sentiments[i];
        let fallbackRating = 3.0;
        if (sentiment?.label === "positive") {
          fallbackRating = sentiment.score > 0.5 ? 4.5 : 4.0;
        } else if (sentiment?.label === "negative") {
          fallbackRating = sentiment.score < -0.5 ? 1.5 : 2.0;
        }

        return {
          rating: fallbackRating,
          review_content: review.review_content,
          sentiment: sentiment?.label,
        };
      })
    );

    // Build complete product data for email
    const completeProductData: ProductEmailData = {
      productName: product.product_name,
      category: product.category,
      price:
        typeof product.discounted_price === "string"
          ? parseFloat(product.discounted_price.replace(/[^0-9.]/g, ""))
          : product.discounted_price,
      discountPrice:
        typeof product.actual_price === "string"
          ? parseFloat(product.actual_price.replace(/[^0-9.]/g, ""))
          : product.actual_price,
      imageUrl: product.img_link,
      reviews: reviewsWithRatings,
      productUrl: product.product_link,
    };

    // Generate email content with Gemini
    const emailContent = await generateProductEmail(completeProductData);

    return NextResponse.json({
      success: true,
      emailContent,
    });
  } catch (error: unknown) {
    console.error("Error generating product email:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate email",
      },
      { status: 500 }
    );
  }
}
