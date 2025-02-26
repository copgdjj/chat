"use client";

import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageInput } from "@/components/chat/MessageInput";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ApiConfigModal } from "@/components/ui/ApiConfigModal";
import { sendChatMessage } from "@/lib/services/api";

import { ChatMessage } from "@/lib/services/api";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (loading) return;

    // Add user message
    const userMessage: ChatMessage = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    
    // Set loading state
    setLoading(true);

    try {
      // Convert messages to the format expected by the API
      const messageHistory = messages.filter(msg => !msg.error).map(({ role, content }) => ({
        role,
        content
      }));
      
      const response = await sendChatMessage(content, messageHistory);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: error instanceof Error ? error.message : "未知错误，请检查网络连接或API配置",
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deepseek Chat</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsConfigOpen(true)}
                className="px-3 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                API Config
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <ChatWindow messages={messages} loading={loading} />
        <MessageInput onSubmit={handleSendMessage} disabled={loading} />
      </div>
      <ApiConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </main>
  );
}
