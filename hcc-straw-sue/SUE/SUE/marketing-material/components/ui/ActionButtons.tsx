import { MessageSquare, Zap, Code2, FileText, Copy, Wand2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  className?: string;
}

export default function ActionButtons({ className }: ActionButtonsProps) {
  const actions = [
    { id: "summarize", label: "Summarize", icon: MessageSquare },
    { id: "extract", label: "Extract", icon: Zap },
    { id: "navigate", label: "Navigate", icon: Code2 },
    { id: "screenshot", label: "Screenshot", icon: FileText },
    { id: "click", label: "Click", icon: Copy },
    { id: "story", label: "Story", icon: Wand2 },
  ];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="border-border hover:border-accent hover:text-accent transition-colors"
          >
            <Icon size={16} className="mr-2" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
