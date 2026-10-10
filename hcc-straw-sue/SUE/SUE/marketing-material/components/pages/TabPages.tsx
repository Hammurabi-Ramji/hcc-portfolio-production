import { useState } from "react";
import { Plus, Trash2, Copy, Share2, Search, Sparkles, Filter, Grid3x3, List, Pin, X, Zap, Cloud, Lock, HardDrive, RefreshCw, AlertCircle, Check, Download } from "lucide-react";
import NeonCard from "@/components/NeonCard";
import NeonButton from "@/components/NeonButton";
import KanbanBoard from "@/components/KanbanBoard";
import { cn } from "@/lib/utils";

// ============ WORK PAGE ============
export function WorkPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedProject, setSelectedProject] = useState<string>("default");

  const projects = [
    { id: "default", name: "All Tasks", color: "cyan" as const, taskCount: 12 },
    { id: "project-1", name: "Product Launch", color: "magenta" as const, taskCount: 8 },
    { id: "project-2", name: "Research", color: "purple" as const, taskCount: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Work</h1>
          <p className="text-muted-foreground mt-1">Manage projects and tasks</p>
        </div>
        <NeonButton accentColor="magenta" className="flex items-center gap-2">
          <Plus size={16} />
          New Project
        </NeonButton>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project.id)}
            className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
              selectedProject === project.id
                ? `border-accent bg-accent/10 text-white`
                : "border-border bg-secondary text-muted-foreground hover:border-accent"
            }`}
          >
            <span className="font-medium">{project.name}</span>
            <span className="text-xs ml-2 opacity-70">({project.taskCount})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "kanban"
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
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
          >
            <List size={18} />
          </button>
        </div>

        <button className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <Filter size={16} />
          <span className="text-sm">Filter</span>
        </button>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard />
      ) : (
        <div className="space-y-2">
          <NeonCard accentColor="cyan">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Task {i}</p>
                    <p className="text-xs text-muted-foreground">Due tomorrow</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">High</span>
                </div>
              ))}
            </div>
          </NeonCard>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeonCard accentColor="cyan">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-white">8</p>
            <p className="text-sm text-muted-foreground mt-1">In Progress</p>
          </div>
        </NeonCard>
        <NeonCard accentColor="magenta">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-white">3</p>
            <p className="text-sm text-muted-foreground mt-1">Due Today</p>
          </div>
        </NeonCard>
        <NeonCard accentColor="purple">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-white">24</p>
            <p className="text-sm text-muted-foreground mt-1">Completed</p>
          </div>
        </NeonCard>
      </div>
    </div>
  );
}

// ============ NOTES PAGE ============
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  pinned: boolean;
}

interface Notebook {
  id: string;
  name: string;
  noteCount: number;
  color: "cyan" | "magenta" | "purple";
}

export function NotesPage() {
  const [selectedNotebook, setSelectedNotebook] = useState<string>("daily");
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "SUE Architecture Overview",
      content: "Dark theme sidebar with purple-cyan gradient accents. 6 main tabs.",
      tags: ["architecture", "design"],
      createdAt: new Date(),
      pinned: true,
    },
    {
      id: "2",
      title: "Component Library",
      content: "NeonCard, MetricWidget, AnimatedProgressBar, KanbanBoard, and more.",
      tags: ["components", "ui"],
      createdAt: new Date(Date.now() - 86400000),
      pinned: false,
    },
  ]);

  const notebooks: Notebook[] = [
    { id: "daily", name: "Daily Notes", noteCount: 5, color: "cyan" },
    { id: "project", name: "Project Notes", noteCount: 12, color: "magenta" },
    { id: "web", name: "Web Clippings", noteCount: 8, color: "purple" },
  ];

  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const handleAddNote = () => {
    if (!newNoteTitle.trim()) return;

    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNoteTitle,
      content: newNoteContent,
      tags: [],
      createdAt: new Date(),
      pinned: false,
    };

    setNotes([note, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Notes</h1>
          <p className="text-muted-foreground mt-1">Capture and organize knowledge</p>
        </div>
        <NeonButton accentColor="purple" className="flex items-center gap-2">
          <Plus size={16} />
          New Note
        </NeonButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <NeonCard accentColor="cyan" className="space-y-3">
            <h3 className="font-display font-bold text-white">Notebooks</h3>
            <div className="space-y-2">
              {notebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  onClick={() => setSelectedNotebook(notebook.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedNotebook === notebook.id
                      ? "bg-accent/20 border border-accent text-white"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                  }`}
                >
                  <p className="text-sm font-medium">{notebook.name}</p>
                  <p className="text-xs opacity-70 mt-1">{notebook.noteCount} notes</p>
                </button>
              ))}
            </div>
          </NeonCard>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <NeonCard accentColor="magenta">
            <div className="space-y-3">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <Sparkles size={16} />
                Quick Capture
              </h3>
              <input
                type="text"
                placeholder="Note title..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
              />
              <textarea
                placeholder="Note content..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-3 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded font-medium transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </NeonCard>

          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">PINNED</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pinnedNotes.map((note) => (
                  <NeonCard key={note.id} accentColor="cyan" className="group cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-display font-bold text-white flex-1">{note.title}</h4>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{note.content}</p>
                    <p className="text-xs text-muted-foreground">{note.createdAt.toLocaleDateString()}</p>
                  </NeonCard>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">ALL NOTES</h3>
            <div className="space-y-2">
              {unpinnedNotes.map((note) => (
                <NeonCard key={note.id} accentColor="purple" className="group cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-white">{note.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{note.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </NeonCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ TABS PAGE ============
interface BrowserTab {
  id: string;
  title: string;
  url: string;
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

export function TabsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "tree">("grid");
  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: "1", title: "React Documentation", url: "react.dev", pinned: true, category: "Documentation" },
    { id: "2", title: "GitHub - SUE Project", url: "github.com/sue-ai", pinned: true, category: "Development" },
    { id: "3", title: "Tailwind CSS", url: "tailwindcss.com", pinned: false, category: "Documentation" },
    { id: "4", title: "TypeScript Handbook", url: "typescriptlang.org", pinned: false, category: "Documentation" },
    { id: "5", title: "Figma - UI Design", url: "figma.com", pinned: false, category: "Design" },
  ]);

  const [sessions] = useState<Session[]>([
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

      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-lg transition-all ${
            viewMode === "grid"
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
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
        >
          <List size={18} />
        </button>
      </div>

      {pinnedTabs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">PINNED</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pinnedTabs.map((tab) => (
              <NeonCard key={tab.id} accentColor="cyan" className="group cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-xs">🌐</div>
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

      {viewMode === "grid" && (
        <div className="space-y-6">
          {Object.entries(groupedTabs).map(([category, categoryTabs]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{category.toUpperCase()}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryTabs.map((tab) => (
                  <NeonCard key={tab.id} accentColor="purple" className="group cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-xs">🌐</div>
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

      {viewMode === "list" && (
        <div className="space-y-2">
          {[...pinnedTabs, ...unpinnedTabs].map((tab) => (
            <NeonCard key={tab.id} accentColor="magenta" className="group">
              <div className="flex items-center gap-3 p-2">
                <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-xs flex-shrink-0">🌐</div>
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
                {session.active && <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">Active</span>}
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

// ============ CLOUD PAGE ============
interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: Date;
}

export function CloudPage() {
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [lastSync, setLastSync] = useState(new Date(Date.now() - 300000));
  const [dataUsage] = useState(45);

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "notion", name: "Notion", icon: "📄", connected: true, lastSync: new Date(Date.now() - 3600000) },
    { id: "github", name: "GitHub", icon: "🐙", connected: true, lastSync: new Date(Date.now() - 7200000) },
    { id: "linear", name: "Linear", icon: "📋", connected: false },
    { id: "slack", name: "Slack", icon: "💬", connected: true, lastSync: new Date(Date.now() - 1800000) },
    { id: "obsidian", name: "Obsidian", icon: "🧠", connected: true, lastSync: new Date(Date.now() - 86400000) },
    { id: "zapier", name: "Zapier", icon: "⚡", connected: false },
  ]);

  const handleSync = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
      setLastSync(new Date());
    }, 2000);
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((int) =>
        int.id === id
          ? { ...int, connected: !int.connected, lastSync: !int.connected ? new Date() : undefined }
          : int
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Cloud</h1>
          <p className="text-muted-foreground mt-1">Sync, backup, and integrations</p>
        </div>
        <NeonButton accentColor="cyan" className="flex items-center gap-2">
          <Cloud size={16} />
          Sync Now
        </NeonButton>
      </div>

      <NeonCard accentColor="cyan">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white">Sync Status</h3>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                syncStatus === "synced"
                  ? "bg-green-500/20 text-green-400"
                  : syncStatus === "syncing"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-red-500/20 text-red-400"
              }`}
            >
              {syncStatus === "synced" && <Check size={14} />}
              {syncStatus === "syncing" && <RefreshCw size={14} className="animate-spin" />}
              {syncStatus === "error" && <AlertCircle size={14} />}
              <span className="capitalize">{syncStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium text-white mt-1">
                {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data Usage</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-magenta-500 transition-all"
                    style={{ width: `${dataUsage}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-white">{dataUsage}%</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Storage</p>
              <p className="text-sm font-medium text-white mt-1">234 MB / 500 MB</p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncStatus === "syncing"}
            className="w-full px-4 py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-accent-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={syncStatus === "syncing" ? "animate-spin" : ""} />
            {syncStatus === "syncing" ? "Syncing..." : "Force Sync"}
          </button>
        </div>
      </NeonCard>

      <NeonCard accentColor="magenta">
        <div className="space-y-4">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <Lock size={18} />
            Data Sovereignty
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-secondary rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Local Storage</p>
              <p className="text-lg font-display font-bold text-white mt-1">SQLite 234 MB</p>
              <p className="text-xs text-muted-foreground mt-1">End-to-End Encrypted</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Backup Status</p>
              <p className="text-lg font-display font-bold text-white mt-1">Auto-Backup Active</p>
              <p className="text-xs text-muted-foreground mt-1">Last backup: 2 hours ago</p>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-colors flex items-center justify-center gap-2">
              <Download size={16} />
              Export All Data
            </button>
            <button className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-colors">
              Self-Host with Docker
            </button>
          </div>
        </div>
      </NeonCard>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">INTEGRATIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((integration) => (
            <NeonCard
              key={integration.id}
              accentColor={integration.connected ? "cyan" : "purple"}
              className="group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{integration.icon}</span>
                    <h4 className="font-display font-bold text-white">{integration.name}</h4>
                  </div>
                  <button
                    onClick={() => toggleIntegration(integration.id)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      integration.connected ? "bg-accent" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        integration.connected ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {integration.connected && integration.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {integration.lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}

                {!integration.connected && <p className="text-xs text-muted-foreground">Not connected</p>}

                <button className="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs rounded transition-colors">
                  {integration.connected ? "Manage" : "Connect"}
                </button>
              </div>
            </NeonCard>
          ))}
        </div>
      </div>

      <NeonCard accentColor="purple">
        <div className="space-y-3">
          <h3 className="font-display font-bold text-white">API Key</h3>
          <div className="flex gap-2">
            <input
              type="password"
              value="••••••••••••••••••••••••"
              readOnly
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground"
            />
            <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded transition-colors">
              Copy
            </button>
          </div>
        </div>
      </NeonCard>
    </div>
  );
}
