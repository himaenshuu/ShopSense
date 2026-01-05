import { NextRequest, NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import type { Message } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const CHATS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CHATS_COLLECTION_ID || "";
const MESSAGES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || "";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    if (!DATABASE_ID || !CHATS_COLLECTION_ID || !MESSAGES_COLLECTION_ID) {
      console.error("Missing Appwrite configuration");
      console.error("DATABASE_ID:", DATABASE_ID);
      console.error("CHATS_COLLECTION_ID:", CHATS_COLLECTION_ID);
      console.error("MESSAGES_COLLECTION_ID:", MESSAGES_COLLECTION_ID);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Fetch the chat document
    const chat = await databases.getDocument(
      DATABASE_ID,
      CHATS_COLLECTION_ID,
      chatId
    );

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Fetch messages for this chat
    const messagesResponse = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal("chatId", chatId),
        Query.orderAsc("createdAt"),
        Query.limit(1000),
      ]
    );

    const messages = (messagesResponse.documents as unknown as Message[]).map(
      (msg) => ({
        id: msg.$id,
        chatId: msg.chatId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      })
    );

    // Return the chat data with messages
    return NextResponse.json({
      success: true,
      data: {
        $id: chat.$id,
        title: chat.title || "Shared Chat",
        messages: messages,
        createdAt: chat.$createdAt,
        updatedAt: chat.$updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching shared chat:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chat",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
