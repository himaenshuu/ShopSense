import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const {
      text,
      voice = "Zephyr",
      tone = "warm, welcoming",
    } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_TOKEN;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-tts",
    });

    // Generate audio using Gemini TTS with Zephyr voice
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Say in a ${tone} tone: ${text}` }] },
      ],
      generationConfig: {
        temperature: 0.7,
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    } as never);

    const response = await result.response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioData = (response as any).candidates?.[0]?.content?.parts?.[0]
      ?.inlineData?.data;

    if (!audioData) {
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: 500 }
      );
    }

    // Return the base64 audio data with correct MIME type
    // Gemini TTS returns PCM audio at 24kHz, 16-bit, mono
    return NextResponse.json({
      audio: audioData,
      mimeType: "audio/pcm",
      sampleRate: 24000,
      channels: 1,
      bitDepth: 16,
    });
  } catch (error) {
    console.error("Error in text-to-speech:", error);
    return NextResponse.json(
      {
        error: "Failed to generate speech",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
