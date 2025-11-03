import React, { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541] shadow-sm transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ChatAI..."
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#40414f] text-[#202123] dark:text-[#ececf1] border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:border-[#10A37F] focus:ring-2 focus:ring-[#10A37F]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm placeholder:text-[#6e6e80] dark:placeholder:text-[#9b9ba5]"
              style={{
                minHeight: "52px",
                maxHeight: "200px",
              }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="bg-[#10A37F] hover:bg-[#0D8C6C] text-white rounded-xl h-[52px] w-[52px] p-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all duration-200 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-center text-[#6e6e80] dark:text-[#9b9ba5] mt-3">
          ChatAI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
