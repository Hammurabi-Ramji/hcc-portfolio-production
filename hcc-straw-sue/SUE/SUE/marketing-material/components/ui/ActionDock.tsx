import { MessageSquare, Copy, Navigation, Camera, Zap, BookOpen } from "lucide-react";
import { useState } from "react";

interface ActionDockProps {
  onAction?: (action: string) => void;
}

const actions = [
  { id: "summarize", icon: MessageSquare, label: "Summarize", color: "cyan" as const },
  { id: "extract", icon: Copy, label: "Extract", color: "magenta" as const },
  { id: "navigate", icon: Navigation, label: "Navigate", color: "purple" as const },
  { id: "screenshot", icon: Camera, label: "Screenshot", color: "cyan" as const },
  { id: "click", icon: Zap, label: "Click", color: "magenta" as const },
  { id: "story", icon: BookOpen, label: "Story", color: "purple" as const },
];

export default function ActionDock({ onAction }: ActionDockProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {actions.map((action) => {
        const Icon = action.icon;
        const bgGradient =
          action.color === "cyan"
            ? "from-cyan-500 to-blue-600"
            : action.color === "magenta"
              ? "from-magenta-500 to-pink-600"
              : "from-purple-500 to-indigo-600";

        return (
          <div key={action.id} className="relative group">
            <button
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => onAction?.(action.id)}
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg hover:shadow-xl`}
            >
              <Icon size={24} />
            </button>

            {/* Tooltip */}
            {hoveredAction === action.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-secondary border border-border rounded text-xs text-foreground whitespace-nowrap">
                {action.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
