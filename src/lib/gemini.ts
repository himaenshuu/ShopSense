/**
 * Google Gemini AI Integration
 *
 * This module provides integration with Google's Gemini AI model
 * with support for streaming responses.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization to support dynamic environment loading
let genAI: GoogleGenerativeAI | null = null;
let initialized = false;

/**
 * Initialize Gemini AI client (called lazily on first use)
 */
function initializeGemini() {
  if (initialized) return;

  initialized = true;
  const GEMINI_API_KEY = process.env.GEMINI_API_TOKEN || "";

  if (!GEMINI_API_KEY) {
    console.error("⚠️ GEMINI_API_TOKEN not found in environment variables");
    console.error("Please add GEMINI_API_TOKEN to your .env file");
    return;
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
  }
}

/**
 * Get Gemini model instance
 * Available models: gemini-2.0-flash-lite, gemini-pro, gemini-1.5-pro
 */
export function getGeminiModel(modelName: string = "gemini-2.5-flash-lite") {
  // Lazy initialization - only initialize when first needed
  initializeGemini();

  if (!genAI) {
    throw new Error(
      "Gemini AI is not initialized. Please check your GEMINI_API_TOKEN."
    );
  }
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Clean markdown formatting from Gemini response
 * Removes bold markers (**) and bullet points (*)
 */
function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*/g, "") // Remove bold markers
    .replace(/^\* /gm, "• ") // Replace asterisk bullets with bullet points
    .replace(/\*/g, ""); // Remove any remaining asterisks
}

/**
 * Generate AI response with streaming
 */
export async function generateStreamingResponse(
  prompt: string,
  conversationHistory?: Array<{ role: string; content: string }>
) {
  try {
    const model = getGeminiModel();

    // Build conversation history if provided
    const chat = model.startChat({
      history:
        conversationHistory?.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })) || [],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    // Send message and get streaming response
    const result = await chat.sendMessageStream(prompt);
    return result.stream;
  } catch (error) {
    console.error("Error in generateStreamingResponse:", error);
    throw new Error(
      `Failed to generate streaming response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export { cleanMarkdownFormatting };

/**
 * Generate AI response (non-streaming)
 */
export async function generateResponse(
  prompt: string,
  conversationHistory?: Array<{ role: string; content: string }>
) {
  try {
    const model = getGeminiModel();

    // Build conversation history if provided
    const chat = model.startChat({
      history:
        conversationHistory?.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })) || [],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error in generateResponse:", error);
    throw new Error(
      `Failed to generate response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
