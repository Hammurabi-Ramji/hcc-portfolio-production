import { useState } from "react";
import { Plus, Filter, Grid3x3, List } from "lucide-react";
import NeonCard from "@/components/NeonCard";
import KanbanBoard from "@/components/KanbanBoard";
import NeonButton from "@/components/NeonButton";

interface Project {
  id: string;
  name: string;
  color: "cyan" | "magenta" | "purple";
  taskCount: number;
}

export default function WorkPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedProject, setSelectedProject] = useState<string>("default");

  const projects: Project[] = [
    { id: "default", name: "All Tasks", color: "cyan", taskCount: 12 },
    { id: "project-1", name: "Product Launch", color: "magenta", taskCount: 8 },
    { id: "project-2", name: "Research", color: "purple", taskCount: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Project Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project.id)}
            className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
              selectedProject === project.id
                ? `border-neon-${project.color} bg-${project.color}-500/10 text-white`
                : "border-border bg-secondary text-muted-foreground hover:border-accent"
            }`}
          >
            <span className="font-medium">{project.name}</span>
            <span className="text-xs ml-2 opacity-70">({project.taskCount})</span>
          </button>
        ))}
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "kanban"
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            title="Kanban View"
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

        <button className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <Filter size={16} />
          <span className="text-sm">Filter</span>
        </button>
      </div>

      {/* Main Content */}
      {viewMode === "kanban" ? (
        <KanbanBoard />
      ) : (
        <div className="space-y-2">
          {/* List View */}
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

      {/* Quick Stats */}
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
