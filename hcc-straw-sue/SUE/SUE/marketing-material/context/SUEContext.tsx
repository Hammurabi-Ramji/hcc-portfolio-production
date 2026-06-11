import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  tags: string[];
  status: "backlog" | "in-progress" | "review" | "done";
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  pinned: boolean;
}

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  pinned: boolean;
  category?: string;
}

interface SUEContextType {
  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: Task["status"]) => void;

  // Notes
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleNotePin: (id: string) => void;

  // Tabs
  tabs: BrowserTab[];
  addTab: (tab: BrowserTab) => void;
  removeTab: (id: string) => void;
  toggleTabPin: (id: string) => void;

  // Sync Status
  lastSync: Date;
  syncStatus: "synced" | "syncing" | "error";
  performSync: () => Promise<void>;

  // Preferences
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

const SUEContext = createContext<SUEContextType | undefined>(undefined);

export function SUEProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [lastSync, setLastSync] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Task management
  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
    // Persist to localStorage
    localStorage.setItem("sue_tasks", JSON.stringify([...tasks, task]));
  }, [tasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem("sue_tasks", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      localStorage.setItem("sue_tasks", JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const moveTask = useCallback((id: string, newStatus: Task["status"]) => {
    updateTask(id, { status: newStatus });
  }, [updateTask]);

  // Note management
  const addNote = useCallback((note: Note) => {
    setNotes((prev) => [...prev, note]);
    localStorage.setItem("sue_notes", JSON.stringify([...notes, note]));
  }, [notes]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      localStorage.setItem("sue_notes", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      localStorage.setItem("sue_notes", JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const toggleNotePin = useCallback((id: string) => {
    updateNote(id, { pinned: !notes.find((n) => n.id === id)?.pinned });
  }, [notes, updateNote]);

  // Tab management
  const addTab = useCallback((tab: BrowserTab) => {
    setTabs((prev) => [...prev, tab]);
    localStorage.setItem("sue_tabs", JSON.stringify([...tabs, tab]));
  }, [tabs]);

  const removeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      localStorage.setItem("sue_tabs", JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const toggleTabPin = useCallback((id: string) => {
    setTabs((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t));
      localStorage.setItem("sue_tabs", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Sync
  const performSync = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      // Simulate sync delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLastSync(new Date());
      setSyncStatus("synced");
    } catch (error) {
      setSyncStatus("error");
      console.error("Sync failed:", error);
    }
  }, []);

  const value: SUEContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    notes,
    addNote,
    updateNote,
    deleteNote,
    toggleNotePin,
    tabs,
    addTab,
    removeTab,
    toggleTabPin,
    lastSync,
    syncStatus,
    performSync,
    theme,
    setTheme,
  };

  return <SUEContext.Provider value={value}>{children}</SUEContext.Provider>;
}

export function useSUE() {
  const context = useContext(SUEContext);
  if (!context) {
    throw new Error("useSUE must be used within SUEProvider");
  }
  return context;
}
