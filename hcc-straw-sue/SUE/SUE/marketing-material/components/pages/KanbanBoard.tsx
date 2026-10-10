import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import NeonCard from "./NeonCard";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  tags: string[];
}

interface Column {
  id: string;
  title: string;
  color: "cyan" | "magenta" | "purple";
  tasks: Task[];
}

interface KanbanBoardProps {
  initialColumns?: Column[];
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void;
  onTaskAdd?: (columnId: string, task: Task) => void;
}

const priorityColors = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function KanbanBoard({ initialColumns, onTaskMove, onTaskAdd }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(
    initialColumns || [
      { id: "backlog", title: "Backlog", color: "cyan", tasks: [] },
      { id: "in-progress", title: "In Progress", color: "magenta", tasks: [] },
      { id: "review", title: "Review", color: "purple", tasks: [] },
      { id: "done", title: "Done", color: "cyan", tasks: [] },
    ]
  );

  const [draggedTask, setDraggedTask] = useState<{ taskId: string; fromColumn: string } | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  const handleAddTask = (columnId: string) => {
    const title = newTaskInputs[columnId]?.trim();
    if (!title) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      priority: "medium",
      tags: [],
    };

    const updatedColumns = columns.map((col) =>
      col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
    );

    setColumns(updatedColumns);
    setNewTaskInputs({ ...newTaskInputs, [columnId]: "" });
    onTaskAdd?.(columnId, newTask);
  };

  const handleDragStart = (taskId: string, columnId: string) => {
    setDraggedTask({ taskId, fromColumn: columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (toColumnId: string) => {
    if (!draggedTask) return;

    if (draggedTask.fromColumn === toColumnId) {
      setDraggedTask(null);
      return;
    }

    const updatedColumns = columns.map((col) => {
      if (col.id === draggedTask.fromColumn) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== draggedTask.taskId),
        };
      }
      if (col.id === toColumnId) {
        const task = columns
          .find((c) => c.id === draggedTask.fromColumn)
          ?.tasks.find((t) => t.id === draggedTask.taskId);
        return { ...col, tasks: task ? [...col.tasks, task] : col.tasks };
      }
      return col;
    });

    setColumns(updatedColumns);
    onTaskMove?.(draggedTask.taskId, draggedTask.fromColumn, toColumnId);
    setDraggedTask(null);
  };

  const handleDeleteTask = (columnId: string, taskId: string) => {
    const updatedColumns = columns.map((col) =>
      col.id === columnId ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) } : col
    );
    setColumns(updatedColumns);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">Kanban Board</h2>
        <div className="text-sm text-muted-foreground">
          {columns.reduce((sum, col) => sum + col.tasks.length, 0)} total tasks
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pb-4 overflow-x-auto">
        {columns.map((column) => (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
            className="flex flex-col gap-3 min-w-[300px]"
          >
            <NeonCard accentColor={column.color} className="flex-1">
              <div className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-white">{column.title}</h3>
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                    {column.tasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-2 min-h-[200px]">
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id, column.id)}
                      className="p-3 bg-secondary rounded-lg border border-border hover:border-accent transition-all cursor-move group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{task.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(column.id, task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </button>
                      </div>

                      {/* Priority & Tags */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded border",
                            priorityColors[task.priority]
                          )}
                        >
                          {task.priority}
                        </span>
                        {task.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-2">{task.dueDate}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Task Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add task..."
                    value={newTaskInputs[column.id] || ""}
                    onChange={(e) =>
                      setNewTaskInputs({ ...newTaskInputs, [column.id]: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddTask(column.id);
                    }}
                    className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="p-2 hover:bg-accent/20 rounded transition-colors"
                  >
                    <Plus size={16} className="text-accent" />
                  </button>
                </div>
              </div>
            </NeonCard>
          </div>
        ))}
      </div>
    </div>
  );
}
