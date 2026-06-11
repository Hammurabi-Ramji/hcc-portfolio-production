import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NeonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  accentColor?: "pink" | "purple" | "indigo" | "cyan" | "magenta";
  fullWidth?: boolean;
}

export default function NeonButton({
  children,
  onClick,
  disabled = false,
  className,
  variant = "primary",
  size = "md",
  accentColor = "purple",
  fullWidth = false,
}: NeonButtonProps) {
  const baseClasses =
    "font-sans font-medium transition-all duration-200 rounded-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const accentClasses: Record<string, Record<string, string>> = {
    pink: {
      primary:   "bg-fuchsia-600 text-white hover:glow-pink",
      secondary: "bg-fuchsia-600/20 text-fuchsia-300 hover:bg-fuchsia-600/30",
      outline:   "border border-fuchsia-500 text-fuchsia-300 hover:bg-fuchsia-600/10",
    },
    purple: {
      primary:   "bg-purple-600 text-white hover:glow-purple",
      secondary: "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30",
      outline:   "border border-purple-500 text-purple-400 hover:bg-purple-600/10",
    },
    indigo: {
      primary:   "bg-indigo-600 text-white hover:glow-indigo",
      secondary: "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30",
      outline:   "border border-indigo-500 text-indigo-400 hover:bg-indigo-600/10",
    },
    // legacy aliases
    cyan:    { primary: "bg-indigo-600 text-white hover:glow-indigo", secondary: "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30", outline: "border border-indigo-500 text-indigo-400 hover:bg-indigo-600/10" },
    magenta: { primary: "bg-fuchsia-600 text-white hover:glow-pink",  secondary: "bg-fuchsia-600/20 text-fuchsia-300 hover:bg-fuchsia-600/30", outline: "border border-fuchsia-500 text-fuchsia-300 hover:bg-fuchsia-600/10" },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        sizeClasses[size],
        accentClasses[accentColor][variant],
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </button>
  );
}
