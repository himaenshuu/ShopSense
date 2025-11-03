import React from "react";
import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatBubble({
  role,
  content,
  isStreaming = false,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`w-full ${
        isUser ? "bg-white dark:bg-[#343541]" : "bg-[#F7F7F8] dark:bg-[#444654]"
      } border-b border-gray-200 dark:border-gray-700 transition-colors duration-150`}
    >
      <div className="max-w-3xl mx-auto px-4 py-6 flex gap-6">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-[#10A37F]" : "bg-[#10A37F]"
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-[#202123] dark:text-[#ececf1] whitespace-pre-wrap break-words leading-7 text-base">
            {content || (
              <span className="inline-flex items-center gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse delay-100">●</span>
                <span className="animate-pulse delay-200">●</span>
              </span>
            )}
            {isStreaming && content && (
              <span className="inline-block w-2 h-5 ml-1 bg-[#10A37F] animate-pulse"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
