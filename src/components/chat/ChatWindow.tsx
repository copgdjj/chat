"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

import { ChatMessage } from "@/lib/services/api";

interface ChatWindowProps {
  messages: ChatMessage[];
  loading?: boolean;
  className?: string;
}

export function ChatWindow({ messages, loading = false, className }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-4 rounded-lg p-4",
              message.role === "user"
                ? "ml-auto bg-gray-700 text-white"
                : message.error
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <div className={cn(
              "prose dark:prose-invert max-w-none",
              message.error && "text-red-600 dark:text-red-400"
            )}>
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-gray-100"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
