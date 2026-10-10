import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  accentColor?: "pink" | "purple" | "indigo" | "cyan" | "magenta";
  glowing?: boolean;
  interactive?: boolean;
  style?: React.CSSProperties;
}

export default function NeonCard({
  children,
  className,
  accentColor = "purple",
  glowing = true,
  interactive = false,
  style,
}: NeonCardProps) {
  const accentClasses: Record<string, string> = {
    pink:    "border-neon-pink glow-pink",
    purple:  "border-neon-purple glow-purple",
    indigo:  "border-neon-indigo glow-indigo",
    // legacy aliases
    cyan:    "border-neon-indigo glow-indigo",
    magenta: "border-neon-pink glow-pink",
  };

  return (
    <div
      style={style}
      className={cn(
        "bg-card border rounded-lg p-6 transition-all duration-300",
        glowing && accentClasses[accentColor],
        interactive && "hover:scale-105 cursor-pointer hover:shadow-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}
