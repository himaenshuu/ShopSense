import { getDatabase } from "./mongodb";

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

class ProductService {
  private dbName = "chatai";
  private collectionName = "amazon_products";

  private async getDb() {
    return getDatabase(this.dbName);
  }

  private async getCollection() {
    const db = await this.getDb();
    return db.collection(this.collectionName);
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    const collection = await this.getCollection();

    // First, try exact match (case-insensitive)
    const exactResults = await collection
      .find({
        product_name: { $regex: new RegExp(`^${query}$`, "i") },
      })
      .limit(limit)
      .toArray();

    if (exactResults.length > 0) {
      console.log(
        `[ProductService] Found ${exactResults.length} exact matches for: ${query}`
      );
      return exactResults as unknown as Product[];
    }

    // Fallback to text search with relevance scoring
    const results = await collection
      .find(
        {
          $text: { $search: query },
        },
        { projection: { score: { $meta: "textScore" } } }
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ score: { $meta: "textScore" } } as any)
      .limit(limit * 2) // Get more results to filter by relevance
      .toArray();

    // Filter results by minimum relevance score (textScore > 1.0 is decent match)
    const relevantResults = results.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc: any) => doc.score && doc.score > 1.0
    );

    if (relevantResults.length > 0) {
      console.log(
        `[ProductService] Found ${relevantResults.length} relevant matches (score > 1.0) for: ${query}`
      );
    } else {
      console.warn(`[ProductService] No relevant matches found for: ${query}`);
    }

    return relevantResults.slice(0, limit) as unknown as Product[];
  }

  async getProductById(productId: string): Promise<Product | null> {
    const collection = await this.getCollection();
    const result = await collection.findOne({ product_id: productId });
    return result as Product | null;
  }

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

  async getProductPrice(query: string): Promise<PriceInfo[]> {
    const products = await this.searchProducts(query, 5);

    return products.map((p) => {
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

  async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
    limit: number = 20,
    category?: string
  ): Promise<Product[]> {
    const collection = await this.getCollection();

    // Build query with optional category filter
    const query: Record<string, unknown> = {};
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    const allProducts = (await collection
      .find(query)
      .limit(2000)
      .toArray()) as unknown as Product[];

    const filtered = allProducts
      .filter((p) => {
        const price = parseFloat(p.discounted_price.replace(/[₹,]/g, "")) || 0;
        return price >= minPrice && price <= maxPrice;
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    console.log(
      `[ProductService] Price range ₹${minPrice}-₹${maxPrice}${
        category ? ` in ${category} category` : ""
      }: found ${filtered.length} products`
    );

    return filtered;
  }

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

  async getTopReviews(
    query: string,
    limit: number = 5
  ): Promise<ProductReview[]> {
    const result = await this.getProductReviews(query, limit);
    return result?.reviews || [];
  }

  async searchReviews(
    productQuery: string,
    keyword: string,
    limit: number = 10
  ): Promise<ProductReview[]> {
    const result = await this.getProductReviews(productQuery, 100);

    if (!result) {
      return [];
    }

    const filtered = result.reviews.filter(
      (review) =>
        review.review_content.toLowerCase().includes(keyword.toLowerCase()) ||
        review.review_title.toLowerCase().includes(keyword.toLowerCase())
    );

    return filtered.slice(0, limit);
  }

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

  async getTotalProductCount(): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments();
  }

  async getCategoryCount(category: string): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments({
      category: { $regex: category, $options: "i" },
    });
  }

  async getAllCategories(): Promise<string[]> {
    const collection = await this.getCollection();
    const categories = await collection.distinct("category");
    return categories as string[];
  }

  async hasRelevantProducts(
    query: string,
    minScore: number = 2.0
  ): Promise<boolean> {
    const collection = await this.getCollection();
    const results = await collection
      .find(
        { $text: { $search: query } },
        { projection: { score: { $meta: "textScore" } } }
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ score: { $meta: "textScore" } } as any)
      .limit(1)
      .toArray();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.length > 0 && (results[0] as any).score >= minScore;
  }
}

export const productService = new ProductService();
