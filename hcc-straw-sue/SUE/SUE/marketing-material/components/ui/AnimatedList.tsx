import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListItem {
  id: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

interface AnimatedListProps {
  items: ListItem[];
  className?: string;
  staggerDelay?: number;
}

export default function AnimatedList({ items, className, staggerDelay = 50 }: AnimatedListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border hover:border-accent transition-all duration-200 hover:shadow-lg hover:shadow-accent/20"
          style={{
            animation: `slideIn 0.3s ease-out ${idx * staggerDelay}ms both`,
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {item.icon && <div className="text-accent flex-shrink-0">{item.icon}</div>}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
            </div>
          </div>
          {item.action && <div className="ml-2 flex-shrink-0">{item.action}</div>}
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
