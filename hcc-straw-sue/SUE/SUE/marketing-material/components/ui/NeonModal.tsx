import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  accentColor?: "cyan" | "magenta" | "purple";
  footer?: ReactNode;
}

export default function NeonModal({
  isOpen,
  onClose,
  title,
  children,
  accentColor = "cyan",
  footer,
}: NeonModalProps) {
  if (!isOpen) return null;

  const accentClasses = {
    cyan: "border-neon-cyan glow-cyan",
    magenta: "border-neon-magenta glow-magenta",
    purple: "border-neon-purple glow-purple",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-card border rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl",
          accentClasses[accentColor]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Footer */}
        {footer && <div className="flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
