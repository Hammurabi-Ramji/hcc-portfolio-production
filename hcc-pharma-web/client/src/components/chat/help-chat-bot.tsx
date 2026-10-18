import { useState, useEffect, useRef } from "react";
import { Bot, X, Send, MessagesSquare, User, MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const INITIAL_GREETING = "Hello! I'm RadixBot, your virtual assistant for the Radix Laboratories platform. How can I help you today? You can ask about our products, services, quality processes, or how to use this platform.";

const botResponses = {
  products: [
    "Radix Laboratories offers a comprehensive range of veterinary pharmaceuticals and nutritional supplements for large animals.",
    "Our key products include Ammoral, Burn Relief, Caprotec, and Calcium Gluconate, all formulated for oral use.",
    "We also provide bottle supply solutions including dropper bottles, nursing bottles, and specialized containers.",
    "All Radix products are manufactured under strict quality control and comply with FDA regulations."
  ],
  quality: [
    "Radix Labs follows cGMP (current Good Manufacturing Practices) for all pharmaceutical production.",
    "Our quality control includes multiple testing stages: raw material verification, in-process testing, and finished product validation.",
    "We conduct stability studies to ensure product efficacy throughout its shelf life.",
    "Our QA system includes detailed documentation tracking through our integrated Laboratory Information Management System (LIMS)."
  ],
  manufacturing: [
    "Our manufacturing facility includes specialized production lines for liquid, powder, and solid formulations.",
    "Each manufacturing batch is tracked with unique lot numbers for complete traceability.",
    "Production follows standardized protocols with documented verification at each step.",
    "Our manufacturing execution system provides real-time monitoring of all production parameters."
  ],
  client_portal: [
    "The client portal provides secure access to product documentation, order history, and quality certificates.",
    "Different user types (veterinarians, wholesalers, farms, regulatory, vendors) have tailored interfaces.",
    "You can download Material Safety Data Sheets (MSDS) and product documentation after logging in.",
    "The portal also allows tracking of orders and manufacturing batches specific to your account."
  ],
  ordering: [
    "Orders can be placed through your client portal account after logging in.",
    "Product availability is displayed in real-time on the product catalog.",
    "For specialized formulations or contract manufacturing, please use the Request a Quote feature.",
    "Order tracking is available in the Orders section of your portal dashboard."
  ],
  general: [
    "Radix Laboratories was established in 1979 and specializes in veterinary pharmaceutical manufacturing.",
    "Our facilities are located in the Midwestern United States with distribution capabilities nationwide.",
    "We serve both the companion animal and large animal veterinary markets.",
    "For specific inquiries, you can reach our customer service at 1-800-927-2349 or info@radixlabs.com."
  ]
};

function generateBotResponse(userInput: string): string {
  // Convert input to lowercase for easier matching
  const input = userInput.toLowerCase();
  
  // Define keywords for each category
  const productKeywords = ['product', 'medication', 'drug', 'supplement', 'ammoral', 'burn relief', 'caprotec', 'calcium', 'bottle', 'catalog'];
  const qualityKeywords = ['quality', 'testing', 'compliance', 'fda', 'regulation', 'cgmp', 'standard', 'certificate', 'msds'];
  const manufacturingKeywords = ['manufacturing', 'production', 'facility', 'batch', 'lot number', 'formulation', 'make'];
  const portalKeywords = ['portal', 'login', 'account', 'dashboard', 'access', 'document', 'download', 'interface'];
  const orderKeywords = ['order', 'purchase', 'buy', 'delivery', 'shipping', 'availability', 'stock', 'quote', 'price'];
  
  // Check which category has the most keyword matches
  const productMatches = productKeywords.filter(keyword => input.includes(keyword)).length;
  const qualityMatches = qualityKeywords.filter(keyword => input.includes(keyword)).length;
  const manufacturingMatches = manufacturingKeywords.filter(keyword => input.includes(keyword)).length;
  const portalMatches = portalKeywords.filter(keyword => input.includes(keyword)).length;
  const orderMatches = orderKeywords.filter(keyword => input.includes(keyword)).length;
  
  // Determine which category to respond from based on match count
  const matchCounts = [
    { category: 'products', count: productMatches },
    { category: 'quality', count: qualityMatches },
    { category: 'manufacturing', count: manufacturingMatches },
    { category: 'client_portal', count: portalMatches },
    { category: 'ordering', count: orderMatches }
  ];
  
  // Sort by match count, highest first
  matchCounts.sort((a, b) => b.count - a.count);
  
  // If we have matches, use the highest category
  if (matchCounts[0].count > 0) {
    const topCategory = matchCounts[0].category as keyof typeof botResponses;
    const responses = botResponses[topCategory];
    // Select responses based on relevance
    if (matchCounts[0].count >= 2) {
      // If strong match, provide more detailed info by combining responses
      return responses.slice(0, 2).join(" ");
    } else {
      // If weak match, provide a single response
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  // Default response if no specific category matches
  return botResponses.general[Math.floor(Math.random() * botResponses.general.length)];
}

const HelpChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: INITIAL_GREETING,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: currentInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput("");
    setIsTyping(true);
    
    // Simulate bot "typing" with a delay
    setTimeout(() => {
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant" as const,
        content: generateBotResponse(currentInput),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="rounded-full w-14 h-14 bg-[#086D38] hover:bg-[#1A5F7A] text-white shadow-lg"
        >
          <MessagesSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className={cn(
          "w-80 md:w-96 transition-all duration-300 shadow-xl border-[#1A5F7A]/20",
          isMinimized ? "h-auto" : "h-[450px] max-h-[80vh]"
        )}>
          <CardHeader className="bg-gradient-to-r from-[#086D38] to-[#1A5F7A] text-white p-3 flex flex-row justify-between items-center rounded-t-lg">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Prem</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" onClick={minimizeChat} className="h-7 w-7 text-white hover:bg-white/10">
                {isMinimized ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleChat} className="h-7 w-7 text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <>
              <CardContent className="p-0 flex-grow">
                <ScrollArea className="h-[350px] p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "mb-4 flex",
                        message.role === "assistant" ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2",
                          message.role === "assistant"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-[#086D38] text-white"
                        )}
                      >
                        <div className="flex items-center mb-1">
                          {message.role === "assistant" ? (
                            <Bot className="h-4 w-4 mr-1" />
                          ) : (
                            <User className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-xs font-medium">
                            {message.role === "assistant" ? "Prem" : "You"}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="text-right">
                          <span className="text-xs opacity-70">
                            {new Intl.DateTimeFormat("en-US", {
                              hour: "numeric",
                              minute: "numeric",
                            }).format(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2">
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-1" />
                          <span className="text-xs font-medium">Prem</span>
                        </div>
                        <div className="flex space-x-1 my-1 px-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-3 border-t">
                <div className="flex w-full items-center space-x-2">
                  <Textarea
                    ref={inputRef}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about products, quality, or services..."
                    className="min-h-9 resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={!currentInput.trim() || isTyping}
                    className="h-9 w-9 bg-[#086D38] hover:bg-[#1A5F7A]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default HelpChatBot;