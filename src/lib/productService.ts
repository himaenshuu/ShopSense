/**
 * Amazon Product Service
 *
 * This service provides methods to query the Amazon products database
 * with support for fuzzy search, price queries, review extraction, and more.
 */

import { getDatabase } from "./mongodb";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProductReview {
  user_id: string;
  user_name: string;
  review_id: string;
  review_title: string;
  review_content: string;
  sentiment?: {
    score: number;
    label: "positive" | "negative" | "neutral";
  };
}

export interface Product {
  _id?: string;
  product_id: string;
  product_name: string;
  category: string;
  discounted_price: string;
  actual_price: string;
  discount_percentage: string;
  rating: number;
  rating_count: string;
  about_product: string;
  img_link: string;
  product_link: string;
  reviews: ProductReview[];
}

export interface PriceInfo {
  product_id: string;
  product_name: string;
  discounted_price: string;
  actual_price: string;
  discount_percentage: string;
  savings: string;
}

// ============================================================================
// PRODUCT SERVICE CLASS
// ============================================================================

class ProductService {
  private dbName = "chatai";
  private collectionName = "amazon_products";

  /**
   * Get database instance
   */
  private async getDb() {
    return getDatabase(this.dbName);
  }

  /**
   * Get collection
   */
  private async getCollection() {
    const db = await this.getDb();
    return db.collection(this.collectionName);
  }

  // ==========================================================================
  // PRODUCT SEARCH
  // ==========================================================================

  /**
   * Search products by name (fuzzy matching)
   * @param query - Search term (e.g., "boat rugged v3", "usb cable")
   * @param limit - Maximum number of results
   */
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    const collection = await this.getCollection();

    // Use text search for better matching
    const results = await collection
      .find({
        $text: { $search: query },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ score: { $meta: "textScore" } } as any)
      .limit(limit)
      .toArray();

    return results as unknown as Product[];
  }

  /**
   * Search products by exact product ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    const collection = await this.getCollection();
    const result = await collection.findOne({ product_id: productId });
    return result as Product | null;
  }

  /**
   * Search products by category
   */
  async getProductsByCategory(
    category: string,
    limit: number = 20
  ): Promise<Product[]> {
    const collection = await this.getCollection();

    const results = await collection
      .find({
        category: { $regex: category, $options: "i" },
      })
      .sort({ rating: -1 })
      .limit(limit)
      .toArray();

    return results as unknown as Product[];
  }

  // ==========================================================================
  // PRICE QUERIES
  // ==========================================================================

  /**
   * Get price information for a product
   * @param query - Product name or search term
   */
  async getProductPrice(query: string): Promise<PriceInfo[]> {
    const products = await this.searchProducts(query, 5);

    return products.map((p) => {
      // Calculate actual savings
      const discounted =
        parseFloat(p.discounted_price.replace(/[₹,]/g, "")) || 0;
      const actual = parseFloat(p.actual_price.replace(/[₹,]/g, "")) || 0;
      const savings = actual - discounted;

      return {
        product_id: p.product_id,
        product_name: p.product_name,
        discounted_price: p.discounted_price,
        actual_price: p.actual_price,
        discount_percentage: p.discount_percentage,
        savings: `₹${savings.toFixed(0)}`,
      };
    });
  }

  /**
   * Get products within a price range
   */
  async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
    limit: number = 20
  ): Promise<Product[]> {
    const collection = await this.getCollection();

    // Note: Prices are stored as strings, so we need to convert them
    const allProducts = (await collection
      .find({})
      .limit(1000)
      .toArray()) as unknown as Product[];

    const filtered = allProducts
      .filter((p) => {
        const price = parseFloat(p.discounted_price.replace(/[₹,]/g, "")) || 0;
        return price >= minPrice && price <= maxPrice;
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return filtered;
  }

  // ==========================================================================
  // REVIEW QUERIES
  // ==========================================================================

  /**
   * Get reviews for a product
   * @param query - Product name or ID
   * @param limit - Maximum number of reviews
   */
  async getProductReviews(
    query: string,
    limit: number = 10
  ): Promise<{
    product: Product;
    reviews: ProductReview[];
  } | null> {
    const products = await this.searchProducts(query, 1);

    if (products.length === 0) {
      return null;
    }

    const product = products[0];
    const reviews = product.reviews.slice(0, limit);

    return {
      product,
      reviews,
    };
  }

  /**
   * Get top-rated reviews for a product
   * Note: Since our data doesn't have individual review ratings,
   * we'll return the most recent/first reviews
   */
  async getTopReviews(
    query: string,
    limit: number = 5
  ): Promise<ProductReview[]> {
    const result = await this.getProductReviews(query, limit);
    return result?.reviews || [];
  }

  /**
   * Search reviews by keyword
   */
  async searchReviews(
    productQuery: string,
    keyword: string,
    limit: number = 10
  ): Promise<ProductReview[]> {
    const result = await this.getProductReviews(productQuery, 100);

    if (!result) {
      return [];
    }

    // Filter reviews containing the keyword
    const filtered = result.reviews.filter(
      (review) =>
        review.review_content.toLowerCase().includes(keyword.toLowerCase()) ||
        review.review_title.toLowerCase().includes(keyword.toLowerCase())
    );

    return filtered.slice(0, limit);
  }

  // ==========================================================================
  // COMPARISON & STATISTICS
  // ==========================================================================

  /**
   * Get top-rated products in a category
   */
  async getTopRatedProducts(
    category?: string,
    limit: number = 10
  ): Promise<Product[]> {
    const collection = await this.getCollection();

    const query = category
      ? { category: { $regex: category, $options: "i" } }
      : {};

    const results = await collection
      .find(query)
      .sort({ rating: -1, rating_count: -1 })
      .limit(limit)
      .toArray();

    return results as unknown as Product[];
  }

  /**
   * Compare multiple products
   */
  async compareProducts(productNames: string[]): Promise<Product[]> {
    const products: Product[] = [];

    for (const name of productNames) {
      const results = await this.searchProducts(name, 1);
      if (results.length > 0) {
        products.push(results[0]);
      }
    }

    return products;
  }

  /**
   * Get product statistics for a search query
   */
  async getProductStats(query: string) {
    const products = await this.searchProducts(query, 100);

    if (products.length === 0) {
      return null;
    }

    const prices = products
      .map((p) => parseFloat(p.discounted_price.replace(/[₹,]/g, "")) || 0)
      .filter((p) => p > 0);

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgRating =
      products.reduce((a, b) => a + b.rating, 0) / products.length;
    const totalReviews = products.reduce((a, b) => a + b.reviews.length, 0);

    return {
      totalProducts: products.length,
      avgPrice: `₹${avgPrice.toFixed(0)}`,
      minPrice: `₹${minPrice.toFixed(0)}`,
      maxPrice: `₹${maxPrice.toFixed(0)}`,
      avgRating: avgRating.toFixed(1),
      totalReviews,
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get total product count
   */
  async getTotalProductCount(): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments();
  }

  /**
   * Get product count by category
   */
  async getCategoryCount(category: string): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments({
      category: { $regex: category, $options: "i" },
    });
  }

  /**
   * Get all unique categories
   */
  async getAllCategories(): Promise<string[]> {
    const collection = await this.getCollection();
    const categories = await collection.distinct("category");
    return categories as string[];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton service instance
export const productService = new ProductService();
