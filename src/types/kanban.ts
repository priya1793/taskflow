export type Priority = "P1" | "P2" | "P3";
export type ViewMode = "board" | "list" | "grid";
export type TaskType = "task" | "story" | "bug" | "defect" | "spike" | "epic";

export const TASK_TYPES: { value: TaskType; label: string; emoji: string }[] = [
  { value: "task", label: "Task", emoji: "📋" },
  { value: "story", label: "Story", emoji: "📖" },
  { value: "bug", label: "Bug", emoji: "🐛" },
  { value: "defect", label: "Defect", emoji: "⚠️" },
  { value: "spike", label: "Spike", emoji: "🔬" },
  { value: "epic", label: "Epic", emoji: "🚀" },
];

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  user: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description: string;
  priority: Priority;
  taskType: TaskType;
  assignee: string;
  dueDate: string | null;
  labels: string[];
  subtasks: Subtask[];
  comments: Comment[];
  activity: ActivityEntry[];
  starred: boolean;
  columnMovedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnDef {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  name: string;
  description: string;
  columns: ColumnDef[];
  wipLimits: Record<string, number>;
  archivedTaskIds: string[];
  createdAt: string;
}

export interface KanbanState {
  boards: Board[];
  tasks: Record<string, Task>;
}

export interface FilterState {
  search: string;
  priority: Priority | "all";
  assignee: string;
  label: string;
}
