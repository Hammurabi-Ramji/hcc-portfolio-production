import { useState } from "react";
import { Home, Sparkles, Briefcase, BookOpen, Grid3x3, Cloud, Menu, X, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "work", label: "Work", icon: Briefcase },
    { id: "notes", label: "Notes", icon: BookOpen },
    { id: "tabs", label: "Tabs", icon: Grid3x3 },
    { id: "cloud", label: "Cloud", icon: Cloud },
    { id: "components", label: "Components", icon: Palette },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border hover:border-accent transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 z-40",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600 flex items-center justify-center glow-brand">
              <span className="text-white font-heading font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-white">SUE</h1>
              <p className="text-xs text-muted-foreground">AI Sidebar</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium glow-purple"
                    : "text-foreground hover:bg-secondary hover:text-accent"
                )}
              >
                <Icon size={20} />
                <span className="font-sans font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <div className="text-xs text-muted-foreground text-center">
            <p>Browse Smarter,</p>
            <p className="text-accent font-medium">Together</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
