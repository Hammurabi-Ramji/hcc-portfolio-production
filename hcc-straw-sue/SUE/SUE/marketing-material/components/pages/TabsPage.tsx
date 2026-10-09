import { useState } from "react";
import { Plus, Grid3x3, List, Pin, X, Zap } from "lucide-react";
import NeonCard from "@/components/NeonCard";
import NeonButton from "@/components/NeonButton";

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  pinned: boolean;
  category?: string;
}

interface Session {
  id: string;
  name: string;
  tabCount: number;
  createdAt: Date;
  active: boolean;
}

export default function TabsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "tree">("grid");
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: "1",
      title: "React Documentation",
      url: "react.dev",
      pinned: true,
      category: "Documentation",
    },
    {
      id: "2",
      title: "GitHub - SUE Project",
      url: "github.com/sue-ai",
      pinned: true,
      category: "Development",
    },
    {
      id: "3",
      title: "Tailwind CSS",
      url: "tailwindcss.com",
      pinned: false,
      category: "Documentation",
    },
    {
      id: "4",
      title: "TypeScript Handbook",
      url: "typescriptlang.org",
      pinned: false,
      category: "Documentation",
    },
    {
      id: "5",
      title: "Figma - UI Design",
      url: "figma.com",
      pinned: false,
      category: "Design",
    },
  ]);

  const [sessions, setSessions] = useState<Session[]>([
    { id: "1", name: "Research Session", tabCount: 12, createdAt: new Date(), active: true },
    { id: "2", name: "Development", tabCount: 8, createdAt: new Date(Date.now() - 86400000), active: false },
    { id: "3", name: "Design Review", tabCount: 5, createdAt: new Date(Date.now() - 172800000), active: false },
  ]);

  const handleTogglePin = (id: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
  };

  const handleCloseTab = (id: string) => {
    setTabs(tabs.filter((t) => t.id !== id));
  };

  const pinnedTabs = tabs.filter((t) => t.pinned);
  const unpinnedTabs = tabs.filter((t) => !t.pinned);

  // Group tabs by category
  const groupedTabs = unpinnedTabs.reduce(
    (acc, tab) => {
      const category = tab.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(tab);
      return acc;
    },
    {} as Record<string, BrowserTab[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Tabs</h1>
          <p className="text-muted-foreground mt-1">Manage browser sessions and tabs</p>
        </div>
        <NeonButton accentColor="cyan" className="flex items-center gap-2">
          <Plus size={16} />
          New Session
        </NeonButton>
      </div>

      {/* Session Selector */}
      <NeonCard accentColor="magenta">
        <div className="space-y-3">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            Active Session: Research Session
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-display font-bold text-white">{tabs.length}</p>
                <p className="text-xs text-muted-foreground">Open Tabs</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-2xl font-display font-bold text-white">{pinnedTabs.length}</p>
                <p className="text-xs text-muted-foreground">Pinned</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg font-medium transition-colors">
              Save Session
            </button>
          </div>
        </div>
      </NeonCard>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            title="List View"
          >
            <List size={18} />
          </button>

        </div>
      </div>

      {/* Pinned Tabs */}
      {pinnedTabs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">PINNED</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pinnedTabs.map((tab) => (
              <NeonCard key={tab.id} accentColor="cyan" className="group cursor-pointer hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-xs">
                    🌐
                  </div>
                  <button
                    onClick={() => handleTogglePin(tab.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent/20 rounded"
                  >
                    <Pin size={14} className="text-accent" />
                  </button>
                </div>
                <h4 className="font-medium text-white text-sm line-clamp-2">{tab.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{tab.url}</p>
              </NeonCard>
            ))}
          </div>
        </div>
      )}

      {/* Tabs by Category */}
      {viewMode === "grid" && (
        <div className="space-y-6">
          {Object.entries(groupedTabs).map(([category, categoryTabs]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{category.toUpperCase()}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryTabs.map((tab) => (
                  <NeonCard
                    key={tab.id}
                    accentColor="purple"
                    className="group cursor-pointer hover:scale-105 transition-transform"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-xs">
                        🌐
                      </div>
                      <button
                        onClick={() => handleCloseTab(tab.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                      >
                        <X size={14} className="text-destructive" />
                      </button>
                    </div>
                    <h4 className="font-medium text-white text-sm line-clamp-2">{tab.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{tab.url}</p>
                  </NeonCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {[...pinnedTabs, ...unpinnedTabs].map((tab) => (
            <NeonCard key={tab.id} accentColor="magenta" className="group">
              <div className="flex items-center gap-3 p-2">
                <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-xs flex-shrink-0">
                  🌐
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tab.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{tab.url}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTogglePin(tab.id)}
                    className="p-1 hover:bg-accent/20 rounded"
                  >
                    <Pin size={14} className={tab.pinned ? "text-accent" : "text-muted-foreground"} />
                  </button>
                  <button
                    onClick={() => handleCloseTab(tab.id)}
                    className="p-1 hover:bg-destructive/20 rounded"
                  >
                    <X size={14} className="text-destructive" />
                  </button>
                </div>
              </div>
            </NeonCard>
          ))}
        </div>
      )}

      {/* Session History */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">SESSION HISTORY</h3>
        <div className="space-y-2">
          {sessions.map((session) => (
            <NeonCard key={session.id} accentColor={session.active ? "cyan" : "purple"}>
              <div className="flex items-center justify-between p-2">
                <div>
                  <p className="font-medium text-white text-sm">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.tabCount} tabs • {session.createdAt.toLocaleDateString()}
                  </p>
                </div>
                {session.active && (
                  <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">Active</span>
                )}
                <button className="px-3 py-1 bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs rounded transition-colors">
                  Restore
                </button>
              </div>
            </NeonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
