import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Sparkles, ChevronDown } from "lucide-react";
import NeonCard from "./NeonCard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  thinking?: string;
  actionPreview?: string;
}

interface AIStreamingChatProps {
  onSendMessage?: (message: string) => void;
}

export default function AIStreamingChat({ onSendMessage }: AIStreamingChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm SUE AI, your intelligent assistant. I can help you with browsing, coding, research, and more. What would you like to do?",
      timestamp: new Date(Date.now() - 60000),
    },
  ]);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    onSendMessage?.(input);

    // Simulate streaming response
    setIsStreaming(true);
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "I'm analyzing your request... This is a simulated response. In production, this would stream from the AI backend.",
        timestamp: new Date(),
        thinking: "Parsing user intent... Checking page context... Preparing response...",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-magenta-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-white">SUE AI</p>
            <p className="text-xs text-muted-foreground">GPT-4 • 2,847/8k tokens</p>
          </div>
        </div>
        <button className="p-1 hover:bg-secondary rounded transition-colors">
          <ChevronDown size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-gradient-to-r from-magenta-500 to-purple-500 text-white"
                  : "bg-secondary text-foreground"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>

              {message.thinking && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <ChevronDown size={12} className={showThinking ? "rotate-180" : ""} />
                    Thinking Process
                  </button>
                  {showThinking && (
                    <p className="text-xs opacity-70 mt-1 italic">{message.thinking}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Action Preview */}
        <NeonCard accentColor="cyan" className="p-3">
          <p className="text-xs text-muted-foreground mb-2">Current Context</p>
          <p className="text-sm text-foreground">Page: React Documentation</p>
          <p className="text-xs text-muted-foreground mt-1">Ready to help with code examples and explanations</p>
        </NeonCard>

        {/* Input */}
        <div className="space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask SUE anything... (Shift+Enter for new line)"
            rows={3}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent resize-none"
          />

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <Paperclip size={16} />
            </button>
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <Mic size={16} />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-magenta-500 hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-medium transition-opacity flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
