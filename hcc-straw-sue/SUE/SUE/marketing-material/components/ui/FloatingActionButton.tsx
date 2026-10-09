import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  label?: string;
  accentColor?: "cyan" | "magenta" | "purple";
  className?: string;
}

export default function FloatingActionButton({
  icon,
  onClick,
  label,
  accentColor = "cyan",
  className,
}: FloatingActionButtonProps) {
  const accentClasses = {
    cyan: "bg-accent hover:glow-cyan text-accent-foreground",
    magenta: "bg-pink-600 hover:glow-magenta text-white",
    purple: "bg-purple-600 hover:glow-purple text-white",
  };

  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg hover:shadow-2xl z-40",
        accentClasses[accentColor],
        className
      )}
    >
      {icon}
    </button>
  );
}
