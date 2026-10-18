import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import NeonCard from "@/components/NeonCard";
import ActionButtons from "@/components/ActionButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm SUE. My systems are online. I am ready to process your natural language requests and automate browser actions. What shall we do?",
      timestamp: new Date(Date.now() - 5 * 60000),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I've processed your request. I can help you with summarization, data extraction, navigation, screenshots, clicking elements, or creating stories. What would you like me to do?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white">Browse Smarter, Together</h1>
        <p className="text-muted-foreground">Your AI co-pilot for everything</p>
      </div>

      {/* Chat Area */}
      <NeonCard accentColor="cyan" className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-display font-bold text-sm">S</span>
                </div>
              )}
              <div
                className={cn(
                  "max-w-xs lg:max-w-md px-4 py-3 rounded-lg",
                  message.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground border border-border"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Loader2 size={16} className="text-white animate-spin" />
              </div>
              <div className="bg-secondary text-foreground border border-border px-4 py-3 rounded-lg">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 pb-6 border-b border-border">
          <ActionButtons />
        </div>

        {/* Input Area */}
        <div className="flex gap-3">
          <Input
            placeholder="Ask SUE to automate something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-all duration-200 glow-cyan"
          >
            <Send size={18} />
          </Button>
        </div>
      </NeonCard>
    </div>
  );
}
