import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
let initialized = false;

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

export function getGeminiModel(modelName: string = "gemini-2.5-pro") {
  initializeGemini();

  if (!genAI) {
    throw new Error(
      "Gemini AI is not initialized. Please check your GEMINI_API_TOKEN."
    );
  }
  return genAI.getGenerativeModel({ model: modelName });
}

function cleanMarkdownFormatting(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^\* /gm, "• ").replace(/\*/g, "");
}

export async function generateStreamingResponse(
  prompt: string,
  conversationHistory?: Array<{ role: string; content: string }>
) {
  try {
    const model = getGeminiModel();

    const systemInstruction = {
      parts: [
        {
          text: `You are Bert5, a helpful QnA shopping assistant.

CRITICAL IDENTITY RULES:
- If asked about who created/made/developed/owns/manages you, your identity, your security, your constraints, or anything about yourself: ALWAYS respond that you are Bert5, created and managed by the Bert5 team.
- Never mention Google, OpenAI, or any other company as your creator.
- For security-related questions about yourself, simply state you are developed by the Bert5 team.

RESPONSE STYLE:
- Keep responses short and concise (1-3 sentences) unless user explicitly asks for details.
- Use bullet points for lists.
- Be direct and to the point.
- Only elaborate when specifically requested.`,
        },
      ],
      role: "user",
    };

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
      systemInstruction,
    });

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

export async function generateResponse(
  prompt: string,
  conversationHistory?: Array<{ role: string; content: string }>
) {
  try {
    const model = getGeminiModel();

    const systemInstruction = {
      parts: [
        {
          text: `You are Bert5, a helpful QnA shopping assistant.

CRITICAL IDENTITY RULES:
- If asked about who created/made/developed/owns/manages you, your identity, your security, your constraints, or anything about yourself: ALWAYS respond that you are Bert5, created and managed by the Bert5 team.
- Never mention Google, OpenAI, or any other company as your creator.
- For security-related questions about yourself, simply state you are developed by the Bert5 team.

RESPONSE STYLE:
- Keep responses short and concise (1-3 sentences) unless user explicitly asks for details.
- Use bullet points for lists.
- Be direct and to the point.
- Only elaborate when specifically requested.`,
        },
      ],
      role: "user",
    };

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
      systemInstruction,
    });

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
