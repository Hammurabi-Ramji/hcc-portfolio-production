import { Globe, Lock, AlertCircle, ExternalLink } from "lucide-react";

interface PageContextHeaderProps {
  title?: string;
  url?: string;
  favicon?: string;
  securityStatus?: "secure" | "warning" | "insecure";
}

export default function PageContextHeader({
  title = "React Documentation",
  url = "https://react.dev",
  favicon = "⚛️",
  securityStatus = "secure",
}: PageContextHeaderProps) {
  const securityIcon =
    securityStatus === "secure" ? (
      <Lock size={14} className="text-green-400" />
    ) : securityStatus === "warning" ? (
      <AlertCircle size={14} className="text-yellow-400" />
    ) : (
      <AlertCircle size={14} className="text-red-400" />
    );

  const securityColor =
    securityStatus === "secure"
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : securityStatus === "warning"
        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30";

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
      {/* Favicon */}
      <div className="w-8 h-8 rounded flex items-center justify-center bg-accent/20 text-lg flex-shrink-0">
        {favicon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{url}</p>
      </div>

      {/* Security Status */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${securityColor}`}>
        {securityIcon}
        <span className="capitalize">{securityStatus}</span>
      </div>

      {/* Open Button */}
      <button className="p-2 hover:bg-accent/20 rounded transition-colors text-muted-foreground hover:text-foreground">
        <ExternalLink size={14} />
      </button>
    </div>
  );
}
