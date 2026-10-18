import { useState } from "react";
import { Plus, Trash2, Copy, Share2, Search, Sparkles } from "lucide-react";
import NeonCard from "@/components/NeonCard";
import NeonButton from "@/components/NeonButton";

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

export default function NotesPage() {
  const [selectedNotebook, setSelectedNotebook] = useState<string>("daily");
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "SUE Architecture Overview",
      content: "Dark theme sidebar with purple-cyan gradient accents. 6 main tabs: Home, AI, Work, Notes, Tabs, Cloud.",
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

  const [editingNote, setEditingNote] = useState<string | null>(null);
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

  const handleTogglePinned = (id: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  return (
    <div className="space-y-6">
      {/* Header */}
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
        {/* Sidebar - Notebooks */}
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

            <div className="border-t border-border pt-3 mt-3">
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={14} />
                <span className="text-xs">New Notebook</span>
              </button>
            </div>
          </NeonCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Add */}
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
                <button className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded transition-colors">
                  <Search size={16} />
                </button>
              </div>
            </div>
          </NeonCard>

          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">PINNED</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pinnedNotes.map((note) => (
                  <NeonCard key={note.id} accentColor="cyan" className="group cursor-pointer hover:scale-105 transition-transform">
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
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {note.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {note.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </NeonCard>
                ))}
              </div>
            </div>
          )}

          {/* All Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">ALL NOTES</h3>
            <div className="space-y-2">
              {unpinnedNotes.map((note) => (
                <NeonCard
                  key={note.id}
                  accentColor="purple"
                  className="group cursor-pointer hover:scale-105 transition-transform"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-white">{note.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{note.content}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePinned(note.id)}
                        className="p-1 hover:bg-accent/20 rounded"
                      >
                        <Copy size={14} className="text-accent" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 hover:bg-destructive/20 rounded"
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
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
