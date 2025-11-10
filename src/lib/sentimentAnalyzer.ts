import { getGeminiModel } from "./gemini";

export interface SentimentResult {
  score: number;
  label: "positive" | "negative" | "neutral";
  confidence: number;
  details: {
    reasoning: string;
    keyPhrases: string[];
  };
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const model = getGeminiModel("gemini-2.0-flash-lite");

    const prompt = `Analyze the sentiment of this product review. Respond ONLY with a JSON object (no markdown, no code blocks) in this exact format:
{
  "score": <number between -1 and 1>,
  "label": "<positive|negative|neutral>",
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief explanation>",
  "keyPhrases": ["<phrase1>", "<phrase2>"]
}

Review: "${text}"

Rules:
- score: -1 (very negative) to 1 (very positive), 0 is neutral
- label: "positive" if score > 0.2, "negative" if score < -0.2, else "neutral"
- confidence: 0-1, how certain you are about the sentiment
- reasoning: one sentence explaining why
- keyPhrases: 2-3 important phrases that indicate sentiment

Return ONLY the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let jsonText = response.trim();
    jsonText = jsonText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    return {
      score: Number(parsed.score) || 0,
      label: parsed.label || "neutral",
      confidence: Number(parsed.confidence) || 0.5,
      details: {
        reasoning: parsed.reasoning || "No reasoning provided",
        keyPhrases: Array.isArray(parsed.keyPhrases) ? parsed.keyPhrases : [],
      },
    };
  } catch (error) {
    console.error("Error in Gemini sentiment analysis:", error);

    return fallbackSentimentAnalysis(text);
  }
}

function fallbackSentimentAnalysis(text: string): SentimentResult {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "love",
    "perfect",
    "best",
    "awesome",
  ];
  const negativeWords = [
    "bad",
    "poor",
    "terrible",
    "awful",
    "hate",
    "worst",
    "disappointed",
    "useless",
  ];

  let score = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) {
      positiveCount++;
      score += 0.3;
    }
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) {
      negativeCount++;
      score -= 0.3;
    }
  });

  // Normalize score to -1 to 1 range
  score = Math.max(-1, Math.min(1, score));

  const label =
    score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral";
  const confidence = Math.min(0.7, (positiveCount + negativeCount) * 0.2);

  return {
    score,
    label,
    confidence,
    details: {
      reasoning: "Fallback lexicon-based analysis",
      keyPhrases: [],
    },
  };
}

export async function analyzeBatchSentiments(
  texts: string[]
): Promise<SentimentResult[]> {
  const results: SentimentResult[] = [];

  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => analyzeSentiment(text))
    );
    results.push(...batchResults);
  }

  return results;
}

export function getSentimentStats(sentiments: SentimentResult[]) {
  if (sentiments.length === 0) {
    return {
      avgScore: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      avgConfidence: 0,
    };
  }

  const positive = sentiments.filter((s) => s.label === "positive").length;
  const negative = sentiments.filter((s) => s.label === "negative").length;
  const neutral = sentiments.filter((s) => s.label === "neutral").length;

  const avgScore =
    sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
  const avgConfidence =
    sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

  return {
    avgScore,
    positive,
    negative,
    neutral,
    avgConfidence,
    positivePercent: parseFloat(
      ((positive / sentiments.length) * 100).toFixed(1)
    ),
    negativePercent: parseFloat(
      ((negative / sentiments.length) * 100).toFixed(1)
    ),
    neutralPercent: parseFloat(
      ((neutral / sentiments.length) * 100).toFixed(1)
    ),
  };
}

export function formatSentiment(result: SentimentResult): string {
  const emoji =
    result.label === "positive"
      ? "😊"
      : result.label === "negative"
      ? "😞"
      : "😐";
  const scorePercent = Math.round((result.score + 1) * 50); // Convert -1 to 1 to 0 to 100

  return (
    `${emoji} ${result.label.toUpperCase()} (${scorePercent}% - confidence: ${Math.round(
      result.confidence * 100
    )}%)\n` +
    `Reasoning: ${result.details.reasoning}` +
    (result.details.keyPhrases.length > 0
      ? `\nKey phrases: ${result.details.keyPhrases.join(", ")}`
      : "")
  );
}

export async function testSentimentAnalyzer() {
  const testReviews = [
    "This product is absolutely amazing! Best purchase I've made in years. Highly recommend!",
    "Terrible quality. Broke after just one week. Complete waste of money.",
    "It's okay, nothing special. Does the job but not impressive.",
    "Love it! Works perfectly and arrived fast. Great value for money!",
    "Very disappointed. Not as described and poor customer service.",
    "Decent product for the price. Some minor issues but overall satisfied.",
  ];

  console.log("🧪 Testing Gemini-powered Sentiment Analyzer\n");

  for (let i = 0; i < testReviews.length; i++) {
    console.log(`Test ${i + 1}: "${testReviews[i].substring(0, 60)}..."`);
    const result = await analyzeSentiment(testReviews[i]);
    console.log(formatSentiment(result));
    console.log("---\n");
  }

  // Test batch analysis
  console.log("\n📊 Batch Analysis Stats:");
  const batchResults = await analyzeBatchSentiments(testReviews);
  const stats = getSentimentStats(batchResults);
  console.log(`Average Score: ${stats.avgScore.toFixed(2)}`);
  console.log(
    `Positive: ${stats.positivePercent}% (${stats.positive} reviews)`
  );
  console.log(
    `Negative: ${stats.negativePercent}% (${stats.negative} reviews)`
  );
  console.log(`Neutral: ${stats.neutralPercent}% (${stats.neutral} reviews)`);
  console.log(`Average Confidence: ${Math.round(stats.avgConfidence * 100)}%`);
}
