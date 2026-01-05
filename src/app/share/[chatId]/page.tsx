"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { ChatBubble } from "@/components/ChatBubble";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface SharedChat {
  $id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function SharedChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!chatId) {
          throw new Error("Chat ID is missing");
        }

        const response = await fetch(`/api/share/${chatId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Chat not found. The chat may have been deleted.");
          }
          throw new Error("Failed to load shared chat");
        }

        const data = await response.json();
        setChat(data.data);
      } catch (err) {
        console.error("Error fetching shared chat:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchSharedChat();
    }
  }, [chatId]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121]">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto w-full">
          <div className="flex-1">
            {chat && (
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {chat.title}
              </h1>
            )}
            {loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading chat...
              </p>
            )}
            {error && <p className="text-sm text-red-500">Error: {error}</p>}
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading shared chat...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Unable to Load Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <Link
                href="/"
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                Go to Home
              </Link>
            </div>
          </div>
        ) : chat ? (
          <div className="max-w-4xl mx-auto w-full py-6 px-4 space-y-4">
            {chat.messages && chat.messages.length > 0 ? (
              <>
                {chat.messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-4">
                  <p>This is a shared conversation</p>
                  <p className="text-xs mt-1">
                    Last updated: {new Date(chat.updatedAt).toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No messages in this chat
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
