export type QueryIntent =
  | "product_price"
  | "product_reviews"
  | "product_info"
  | "product_comparison"
  | "product_search"
  | "email_request"
  | "general_question"
  | "greeting"
  | "about_me"
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
  about_me: {
    keywords: [
      "who made",
      "who created",
      "who owns",
      "made by",
      "created by",
      "who are you",
      "what are you",
      "tell me about yourself",
      "about you",
    ],
    patterns: [
      /(?:who made|who created|who built|who owns) (?:you|bert5)/i,
      /who (?:are you|is|made)/i,
      /what (?:are you|is bert5)/i,
      /tell me about (?:yourself|bert5|you)/i,
      /(?:about|creator|creator of) (?:bert5|you)/i,
    ],
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

function extractLimit(query: string): number | undefined {
  const match = query.match(
    /(?:top|show|get|list|first)\s+(\d+|five|ten|twenty)/i
  );
  if (match) {
    const numMap: Record<string, number> = { five: 5, ten: 10, twenty: 20 };
    const value = match[1].toLowerCase();
    const num = numMap[value] || parseInt(match[1], 10);

    // Validate number is valid and within reasonable range
    if (isNaN(num) || num <= 0 || num > 100) {
      return undefined;
    }

    return num;
  }
  return undefined;
}

function extractCategory(query: string): string | undefined {
  const categoryPatterns = [
    // Order matters: more specific patterns first to avoid false matches
    { regex: /headphone|earphone|earbud|headset/i, category: "headphone" },
    {
      regex:
        /smartphone|\bphone(?!\s*(?:charger|case|cover|holder|stand|mount))/i,
      category: "smartphone",
    },
    { regex: /\btv\b|television/i, category: "tv" },
    { regex: /speaker|audio/i, category: "speaker" },
    { regex: /laptop|notebook/i, category: "laptop" },
    { regex: /tablet|ipad/i, category: "tablet" },
    { regex: /watch|smartwatch/i, category: "watch" },
    { regex: /camera/i, category: "camera" },
  ];

  for (const { regex, category } of categoryPatterns) {
    if (regex.test(query)) {
      return category;
    }
  }

  return undefined;
}

// Pre-compiled brand patterns for performance (defined outside function)
const BRAND_PATTERNS = [
  "iqoo",
  "oneplus",
  "samsung",
  "mi",
  "boat",
  "sony",
  "apple",
  "realme",
  "redmi",
  "oppo",
  "vivo",
  "lg",
  "dell",
  "hp",
  "lenovo",
  "asus",
  "acer",
  "msi",
  "jbl",
  "bose",
  "philips",
  "amazon",
  "xiaomi",
  "motorola",
  "nokia",
].map((brand) => ({
  brand,
  regex: new RegExp(`\\b(${brand}(?:\\s+\\w+){0,3})\\b`, "i"),
}));

function extractProductName(
  query: string,
  intent: QueryIntent
): string | undefined {
  const intentConfig = INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS];
  const patterns = intentConfig?.patterns;

  // For product_search intent, only extract specific brand names, not categories
  if (intent === "product_search") {
    const lowerQuery = query.toLowerCase();

    // Use pre-compiled regex patterns for better performance
    for (const { brand, regex } of BRAND_PATTERNS) {
      if (lowerQuery.includes(brand)) {
        const brandMatch = query.match(regex);
        if (brandMatch && brandMatch[1]) {
          return brandMatch[1].trim();
        }
      }
    }

    // If no brand found, don't extract product name - let category extraction handle it
    return undefined;
  }

  if (!patterns) return undefined;

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const cleaned = query
    .replace(/^(?:what is|what's|show me|tell me|get|find)\s+/i, "")
    .replace(/\?$/, "")
    .trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

function extractPriceRange(
  query: string
): { min: number; max: number } | undefined {
  // Helper to parse price with k/lakh suffix
  const parsePrice = (value: string): number => {
    const num = parseFloat(value);
    if (isNaN(num)) return NaN;

    const lowerValue = value.toLowerCase();
    if (lowerValue.includes("k")) return num * 1000;
    if (lowerValue.includes("lakh") || lowerValue.includes("lac"))
      return num * 100000;
    return num;
  };

  // Match patterns like "between ₹10k to ₹20k" or "from 10000 - 20000"
  const rangeMatch = query.match(
    /(?:between|from)\s+₹?(\d+(?:\.\d+)?)\s*k?(?:lakh|lac)?\s+(?:to|and|-)\s+₹?(\d+(?:\.\d+)?)\s*k?(?:lakh|lac)?/i
  );
  if (rangeMatch) {
    const min = parsePrice(
      rangeMatch[1] + (rangeMatch[0].toLowerCase().includes("k") ? "k" : "")
    );
    const max = parsePrice(
      rangeMatch[2] + (rangeMatch[0].toLowerCase().includes("k") ? "k" : "")
    );

    if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min >= max) {
      return undefined;
    }

    return { min, max };
  }

  // Match "under ₹20k" or "under 20000"
  const underMatch = query.match(
    /under\s+₹?(\d+(?:\.\d+)?)\s*k?(?:lakh|lac)?/i
  );
  if (underMatch) {
    const max = parsePrice(
      underMatch[1] + (underMatch[0].toLowerCase().includes("k") ? "k" : "")
    );

    if (isNaN(max) || max <= 0) {
      return undefined;
    }

    return { min: 0, max };
  }

  // Match "above ₹10k" or "above 10000"
  const aboveMatch = query.match(
    /above\s+₹?(\d+(?:\.\d+)?)\s*k?(?:lakh|lac)?/i
  );
  if (aboveMatch) {
    const min = parsePrice(
      aboveMatch[1] + (aboveMatch[0].toLowerCase().includes("k") ? "k" : "")
    );

    if (isNaN(min) || min < 0) {
      return undefined;
    }

    return { min, max: 999999 };
  }

  return undefined;
}

function isProductRelated(query: string): boolean {
  const productKeywords = [
    "smartphone",
    "phone",
    "mobile",
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
    "earbud",
    "tv",
    "television",
    "remote",
    "mouse",
    "keyboard",
    "laptop",
    "tablet",
    "watch",
    "camera",
    "boat",
    "amazon",
    "samsung",
    "mi",
    "oneplus",
    "apple",
    "iqoo",
    "brand",
  ];

  const lowerQuery = query.toLowerCase();
  return productKeywords.some((keyword) => lowerQuery.includes(keyword));
}

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

  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;

    const keywordMatches = config.keywords.filter((kw) =>
      lowerQuery.includes(kw)
    );
    score += keywordMatches.length * 2;

    const patternMatch = config.patterns?.some((p) => p.test(query));
    if (patternMatch) {
      score += 5;
    }

    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent as QueryIntent;
    }
  }

  if (maxScore === 0 && isProductRelated(query)) {
    bestIntent = "product_info";
    maxScore = 3;
  }

  if (maxScore === 0 && /^(what|why|how|when|where|who)/i.test(query)) {
    bestIntent = "general_question";
    maxScore = 2;
  }

  // Normalize confidence: cap at 10 for scaling, ensure 0-1 range
  const normalizedScore = Math.min(maxScore, 10);
  const confidence = normalizedScore / 10;

  // Apply minimum confidence threshold
  const MIN_CONFIDENCE = 0.2;
  if (
    confidence < MIN_CONFIDENCE &&
    bestIntent !== "greeting" &&
    bestIntent !== "about_me"
  ) {
    // Low confidence - default to general question or unknown
    bestIntent = maxScore > 0 ? "general_question" : "unknown";
  }

  const dataRequiredIntents: QueryIntent[] = [
    "product_price",
    "product_reviews",
    "product_info",
    "product_comparison",
    "product_search",
    "email_request",
  ];
  const requiresData = dataRequiredIntents.includes(bestIntent);

  const extractedEntities: IntentClassification["extractedEntities"] = {
    productName: extractProductName(query, bestIntent),
    productCategory: extractCategory(query),
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
