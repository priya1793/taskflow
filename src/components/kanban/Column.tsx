import React, { useState } from "react";
import type { Task, ColumnDef, ViewMode } from "@/types/kanban";
import TaskCard from "./TaskCard";
import EmptyState from "./EmptyState";
import {
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Archive,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ColumnProps {
  column: ColumnDef;
  tasks: Task[];
  boardId: string;
  wipLimit?: number;
  selectedTasks: string[];
  isBulkMode: boolean;
  onDrop: (taskId: string, fromColumnId: string) => void;
  onTaskClick: (taskId: string) => void;
  onToggleSelect: (taskId: string) => void;
  onAddTask: (title: string) => void;
  onArchive?: () => void;
  onRenameColumn?: (newTitle: string) => void;
  onDeleteColumn?: () => void;
  onMoveColumn?: (direction: "left" | "right") => void;
  onDeleteTask?: (taskId: string) => void;
  viewMode?: ViewMode;
  hasActiveFilters?: boolean;
  totalUnfilteredCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
}

const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  wipLimit,
  selectedTasks,
  isBulkMode,
  onDrop,
  onTaskClick,
  onToggleSelect,
  onAddTask,
  onArchive,
  onRenameColumn,
  onDeleteColumn,
  onMoveColumn,
  onDeleteTask,
  viewMode = "board",
  hasActiveFilters,
  totalUnfilteredCount = 0,
  isFirst,
  isLast,
}) => {
  const [isOver, setIsOver] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAtLimit = wipLimit !== undefined && tasks.length >= wipLimit;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.fromColumnId !== column.id) {
        onDrop(data.taskId, data.fromColumnId);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddTask(newTitle.trim());
      setNewTitle("");
      setShowAdd(false);
    }
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && onRenameColumn) {
      onRenameColumn(renameValue.trim());
    }
    setIsRenaming(false);
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col w-72 shrink-0 rounded-xl border bg-column transition-all duration-200",
          isOver && "column-drop-active border-dashed scale-[1.01]",
          collapsed && "w-12",
        )}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-3 border-b",
            collapsed && "flex-col gap-2 px-1",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {!collapsed && (
              <>
                {isRenaming ? (
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit();
                      if (e.key === "Escape") setIsRenaming(false);
                    }}
                    className="h-6 text-sm font-semibold px-1 py-0 bg-secondary/50"
                  />
                ) : (
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {column.title}
                  </h3>
                )}
                <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 shrink-0">
                  {tasks.length}
                </span>
              </>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1 shrink-0">
              {isAtLimit && (
                <span className="flex items-center gap-1 text-[10px] text-priority-p2">
                  <AlertTriangle className="w-3 h-3" /> WIP {wipLimit}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameValue(column.title);
                      setIsRenaming(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                  </DropdownMenuItem>
                  {onMoveColumn && !isFirst && (
                    <DropdownMenuItem onClick={() => onMoveColumn("left")}>
                      <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Move Left
                    </DropdownMenuItem>
                  )}
                  {onMoveColumn && !isLast && (
                    <DropdownMenuItem onClick={() => onMoveColumn("right")}>
                      <ArrowRight className="w-3.5 h-3.5 mr-2" /> Move Right
                    </DropdownMenuItem>
                  )}
                  {onArchive && tasks.length > 0 && (
                    <DropdownMenuItem onClick={onArchive}>
                      <Archive className="w-3.5 h-3.5 mr-2" /> Archive Tasks
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {collapsed ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-muted-foreground [writing-mode:vertical-lr] rotate-180">
              {column.title}
            </span>
          </div>
        ) : (
          <>
            {/* Tasks */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin min-h-[80px]">
              {tasks.length === 0 &&
              hasActiveFilters &&
              totalUnfilteredCount > 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground">
                    No matching tasks
                  </p>
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState type="no-tasks" message="Drop or add tasks here." />
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columnId={column.id}
                    isSelected={selectedTasks.includes(task.id)}
                    isBulkMode={isBulkMode}
                    onToggleSelect={() => onToggleSelect(task.id)}
                    onClick={() => onTaskClick(task.id)}
                    onDelete={
                      onDeleteTask ? () => onDeleteTask(task.id) : undefined
                    }
                    viewMode={viewMode}
                  />
                ))
              )}
            </div>

            {/* Add Task */}
            <div className="p-2 border-t">
              {showAdd ? (
                <form onSubmit={handleSubmit}>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => {
                      if (!newTitle.trim()) setShowAdd(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setShowAdd(false);
                    }}
                    placeholder="Task title..."
                    className="w-full bg-secondary text-sm rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </form>
              ) : (
                <button
                  data-add-task
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground rounded-md px-2 py-1.5 hover:bg-secondary transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add task
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{column.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {tasks.length > 0
                ? `This will delete ${tasks.length} task(s) in this column. This action cannot be undone.`
                : "This empty column will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteColumn?.();
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Column;
