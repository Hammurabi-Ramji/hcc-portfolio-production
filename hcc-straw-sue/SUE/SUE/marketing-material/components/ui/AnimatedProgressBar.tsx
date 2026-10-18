import { cn } from "@/lib/utils";

interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  accentColor?: "pink" | "purple" | "indigo" | "cyan" | "magenta";
  animated?: boolean;
  className?: string;
}

export default function AnimatedProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  accentColor = "purple",
  animated = true,
  className,
}: AnimatedProgressBarProps) {
  const percentage = (value / max) * 100;

  const accentClasses: Record<string, string> = {
    pink:    "from-fuchsia-500 to-violet-600",
    purple:  "from-violet-500 to-indigo-600",
    indigo:  "from-indigo-500 to-violet-500",
    cyan:    "from-indigo-500 to-violet-500",
    magenta: "from-fuchsia-500 to-violet-600",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showPercentage && <span className="text-sm font-medium text-accent">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden border border-border">
        <div
          className={cn(
            `h-full bg-gradient-to-r ${accentClasses[accentColor]} transition-all duration-500 ease-out`,
            animated && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
