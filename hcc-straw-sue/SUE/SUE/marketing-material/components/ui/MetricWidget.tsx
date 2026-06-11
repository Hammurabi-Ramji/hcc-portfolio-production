import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricWidgetProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  accentColor?: "pink" | "purple" | "indigo" | "cyan" | "magenta";
  className?: string;
}

export default function MetricWidget({
  icon,
  label,
  value,
  change,
  trend,
  accentColor = "purple",
  className,
}: MetricWidgetProps) {
  const accentClasses: Record<string, string> = {
    pink:    "border-neon-pink glow-pink",
    purple:  "border-neon-purple glow-purple",
    indigo:  "border-neon-indigo glow-indigo",
    cyan:    "border-neon-indigo glow-indigo",
    magenta: "border-neon-pink glow-pink",
  };

  const trendColor = trend === "up" ? "text-green-400" : "text-red-400";
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-6 transition-all duration-300 hover:scale-105",
        accentClasses[accentColor],
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-accent/20">{icon}</div>
        <TrendIcon size={16} className={trendColor} />
      </div>

      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-heading font-bold text-white mb-2">{value}</p>
      <p className={cn("text-xs font-medium", trendColor)}>
        {trend === "up" ? "↑" : "↓"} {Math.abs(change)}% vs last week
      </p>
    </div>
  );
}
