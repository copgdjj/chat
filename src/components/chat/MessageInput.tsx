"use client";

import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface MessageInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({ onSubmit, disabled = false, className }: MessageInputProps) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(input);
      setInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-2 p-4", className)}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled || isSubmitting}
        placeholder={isSubmitting ? "Sending..." : "Type a message..."}
        className="flex-1 min-w-0 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
      />
      <button
        type="submit"
        disabled={disabled || isSubmitting || !input.trim()}
        className={cn(
          "rounded-lg px-4 py-2 font-medium text-white transition-colors",
          "bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        Send
      </button>
    </form>
  );
}
