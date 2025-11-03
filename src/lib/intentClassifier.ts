/**
 * Query Intent Classifier
 *
 * Determines whether a user query requires:
 * - CSV data (product info, prices, reviews)
 * - LLM only (general questions, explanations)
 * - Hybrid (data + LLM analysis)
 */

export type QueryIntent =
  | "product_price" // "What is the price of X?"
  | "product_reviews" // "Show me reviews of X"
  | "product_info" // "Tell me about X product"
  | "product_comparison" // "Compare X vs Y"
  | "product_search" // "Best USB cables", "Top rated headphones"
  | "email_request" // "Email me details of X", "Send product info to email"
  | "general_question" // "What is USB-C?", "How does charging work?"
  | "greeting" // "Hello", "Hi"
  | "unknown";

export interface IntentClassification {
  intent: QueryIntent;
  confidence: number; // 0-1
  requiresData: boolean; // Does it need CSV/MongoDB data?
  extractedEntities: {
    productName?: string;
    productCategory?: string;
    priceRange?: { min: number; max: number };
    limit?: number; // "top 5", "show 10"
  };
  reasoning?: string;
}

/**
 * Intent patterns with keywords and regex
 */
const INTENT_PATTERNS = {
  product_price: {
    keywords: [
      "price",
      "cost",
      "expensive",
      "cheap",
      "rate",
      "mrp",
      "discount",
      "offer",
      "deal",
    ],
    patterns: [
      /(?:what is|what's|show|tell|get)(?: the)? price (?:of|for) (.+)/i,
      /how much (?:is|does|cost) (.+)/i,
      /price of (.+)/i,
    ],
  },
  product_reviews: {
    keywords: [
      "review",
      "comment",
      "feedback",
      "opinion",
      "rating",
      "testimonial",
      "experience",
    ],
    patterns: [
      /(?:show|get|find)(?: me)?(?: the)? (?:reviews?|comments?) (?:of|on|for|about) (.+)/i,
      /(?:what are|what's)(?: the)? (?:reviews?|comments?) (?:of|on|for) (.+)/i,
      /top (?:\d+)? (?:reviews?|comments?) (?:of|on|for) (.+)/i,
    ],
  },
  product_info: {
    keywords: [
      "about",
      "detail",
      "specification",
      "spec",
      "feature",
      "information",
      "describe",
    ],
    patterns: [
      /(?:tell me|what is|what's|show me) (?:about|more about) (.+)/i,
      /(?:details?|info|information) (?:of|on|about|for) (.+)/i,
      /(?:specifications?|specs?) (?:of|for) (.+)/i,
    ],
  },
  product_comparison: {
    keywords: [
      "compare",
      "comparison",
      "vs",
      "versus",
      "difference",
      "better",
      "best between",
    ],
    patterns: [
      /compare (.+) (?:and|vs|versus|with) (.+)/i,
      /(?:which is|what's) better[,:]? (.+) or (.+)/i,
      /difference between (.+) and (.+)/i,
    ],
  },
  product_search: {
    keywords: [
      "best",
      "top",
      "recommend",
      "suggest",
      "good",
      "popular",
      "trending",
    ],
    patterns: [
      /(?:best|top) (?:\d+)? (.+)/i,
      /recommend(?: me)?(?: some)? (.+)/i,
      /(?:show|list) (?:top|best) (.+)/i,
    ],
  },
  email_request: {
    keywords: ["email", "mail", "send", "forward", "share"],
    patterns: [
      /(?:email|mail|send)(?: me)?(?: the)? (?:details?|info|information) (?:of|on|about|for) (.+)/i,
      /send (?:details?|info) (?:of|on|about) (.+) to (?:my )?(?:email|mail)/i,
      /(?:email|mail|send) (?:me|this|that)(?: product| product details)?/i,
      /share (.+) (?:via|through|by) email/i,
      /(?:email|send|mail) me (?:about |details of )?(.+)/i,
    ],
  },
  greeting: {
    keywords: [
      "hello",
      "hi",
      "hey",
      "greetings",
      "good morning",
      "good afternoon",
      "good evening",
    ],
    patterns: [/^(?:hi|hello|hey|greetings?)(?:\s|!|\.)*$/i],
  },
  general_question: {
    keywords: [
      "what",
      "why",
      "how",
      "when",
      "where",
      "explain",
      "meaning",
      "define",
    ],
    patterns: [
      /what is (.+)\?/i,
      /how does (.+) work\??/i,
      /why (?:is|does) (.+)\??/i,
      /explain (.+)/i,
    ],
  },
};

/**
 * Extract limit number from query (e.g., "top 5", "show 10")
 */
function extractLimit(query: string): number | undefined {
  const match = query.match(/(?:top|show|get|list)\s+(\d+)/i);
  if (match) {
    const num = parseInt(match[1]);
    return num > 0 && num <= 100 ? num : undefined;
  }
  return undefined;
}

/**
 * Extract product name from query
 */
function extractProductName(
  query: string,
  intent: QueryIntent
): string | undefined {
  const intentConfig = INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS];
  const patterns = intentConfig?.patterns;
  if (!patterns) return undefined;

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: remove common question words
  const cleaned = query
    .replace(/^(?:what is|what's|show me|tell me|get|find)\s+/i, "")
    .replace(/\?$/, "")
    .trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Extract price range from query
 */
function extractPriceRange(
  query: string
): { min: number; max: number } | undefined {
  const rangeMatch = query.match(
    /(?:between|from)\s+₹?(\d+)\s+(?:to|and|-)\s+₹?(\d+)/i
  );
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2]),
    };
  }

  const underMatch = query.match(/under\s+₹?(\d+)/i);
  if (underMatch) {
    return {
      min: 0,
      max: parseInt(underMatch[1]),
    };
  }

  const aboveMatch = query.match(/above\s+₹?(\d+)/i);
  if (aboveMatch) {
    return {
      min: parseInt(aboveMatch[1]),
      max: 999999,
    };
  }

  return undefined;
}

/**
 * Check if query is asking about a product in our database
 * (vs general knowledge question)
 */
function isProductRelated(query: string): boolean {
  const productKeywords = [
    "cable",
    "charger",
    "adapter",
    "usb",
    "hdmi",
    "wire",
    "bluetooth",
    "speaker",
    "headphone",
    "earphone",
    "tv",
    "remote",
    "mouse",
    "keyboard",
    "boat",
    "amazon",
    "samsung",
    "mi",
    "oneplus",
    "apple",
    "brand",
  ];

  const lowerQuery = query.toLowerCase();
  return productKeywords.some((keyword) => lowerQuery.includes(keyword));
}

/**
 * Classify user query intent
 */
export function classifyIntent(query: string): IntentClassification {
  if (!query || query.trim().length === 0) {
    return {
      intent: "unknown",
      confidence: 0,
      requiresData: false,
      extractedEntities: {},
    };
  }

  const lowerQuery = query.toLowerCase();
  let bestIntent: QueryIntent = "unknown";
  let maxScore = 0;

  // Check each intent
  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;

    // Check keywords
    const keywordMatches = config.keywords.filter((kw) =>
      lowerQuery.includes(kw)
    );
    score += keywordMatches.length * 2;

    // Check patterns
    const patternMatch = config.patterns?.some((p) => p.test(query));
    if (patternMatch) {
      score += 5;
    }

    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent as QueryIntent;
    }
  }

  // If no clear intent but product-related, assume product_info
  if (maxScore === 0 && isProductRelated(query)) {
    bestIntent = "product_info";
    maxScore = 3;
  }

  // If still unknown and has question words, assume general_question
  if (maxScore === 0 && /^(what|why|how|when|where|who)/i.test(query)) {
    bestIntent = "general_question";
    maxScore = 2;
  }

  // Calculate confidence
  const confidence = Math.min(maxScore / 10, 1);

  // Determine if data is required
  const dataRequiredIntents: QueryIntent[] = [
    "product_price",
    "product_reviews",
    "product_info",
    "product_comparison",
    "product_search",
    "email_request",
  ];
  const requiresData = dataRequiredIntents.includes(bestIntent);

  // Extract entities
  const extractedEntities: IntentClassification["extractedEntities"] = {
    productName: extractProductName(query, bestIntent),
    limit: extractLimit(query),
    priceRange: extractPriceRange(query),
  };

  return {
    intent: bestIntent,
    confidence: parseFloat(confidence.toFixed(2)),
    requiresData,
    extractedEntities,
    reasoning: `Matched ${bestIntent} with score ${maxScore}`,
  };
}

/**
 * Format intent classification as human-readable string
 */
export function formatIntentClassification(
  classification: IntentClassification
): string {
  const { intent, confidence, requiresData, extractedEntities } =
    classification;

  let result = `Intent: ${intent} (${Math.round(
    confidence * 100
  )}% confident)\n`;
  result += `Requires Data: ${requiresData ? "Yes" : "No"}\n`;

  if (extractedEntities.productName) {
    result += `Product: "${extractedEntities.productName}"\n`;
  }
  if (extractedEntities.limit) {
    result += `Limit: ${extractedEntities.limit}\n`;
  }
  if (extractedEntities.priceRange) {
    result += `Price Range: ₹${extractedEntities.priceRange.min} - ₹${extractedEntities.priceRange.max}\n`;
  }

  return result;
}

/**
 * Test intent classifier with examples
 */
export function testIntentClassifier() {
  const testQueries = [
    "What is the price of boat rugged v3?",
    "Show me top comments on boat type c cable",
    "What is USB-C?",
    "Best USB cables under 500 rupees",
    "Compare boat vs ambrane cables",
    "Tell me about Samsung TV",
    "How does fast charging work?",
    "Top 10 headphones",
    "Hello",
  ];

  console.log("🧪 Testing Intent Classifier\n");
  testQueries.forEach((query, i) => {
    console.log(`Test ${i + 1}: "${query}"`);
    const result = classifyIntent(query);
    console.log(formatIntentClassification(result));
    console.log("---\n");
  });
}
