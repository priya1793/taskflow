import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKanban, useBoard, useBoardTasks } from "@/context/KanbanContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import Column from "@/components/kanban/Column";
import TaskModal from "@/components/kanban/TaskModal";
import Filters from "@/components/kanban/Filters";
import BulkActions from "@/components/kanban/BulkActions";
import EmptyState from "@/components/kanban/EmptyState";
import ThemeToggle from "@/components/ThemeToggle";
import type { FilterState, Task, ViewMode } from "@/types/kanban";
import { TASK_TYPES } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
import {
  ArrowLeft,
  Plus,
  LayoutDashboard,
  Undo2,
  MousePointer,
  LayoutGrid,
  List,
  Columns3,
  Star,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

const defaultFilters: FilterState = {
  search: "",
  priority: "all",
  assignee: "",
  label: "",
};

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, undo } = useKanban();
  const board = useBoard(boardId!);
  const allTasks = useBoardTasks(boardId!);
  const { toast } = useToast();
  const { addRecentlyViewed } = useRecentlyViewed();

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [loading, setLoading] = useState(true);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<string | null>(
    null,
  );
  const isBulkMode = selectedTasks.length > 0;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const assignees = useMemo(
    () => [...new Set(allTasks.map((t) => t.assignee).filter(Boolean))],
    [allTasks],
  );
  const labels = useMemo(
    () => [...new Set(allTasks.flatMap((t) => t.labels))],
    [allTasks],
  );

  const hasActiveFilters =
    filters.search !== "" ||
    filters.priority !== "all" ||
    filters.assignee !== "" ||
    filters.label !== "";

  const filterTasks = useCallback(
    (taskIds: string[]): Task[] => {
      return taskIds
        .map((id) => state.tasks[id])
        .filter((t): t is Task => !!t)
        .filter((t) => {
          if (
            filters.search &&
            !t.title.toLowerCase().includes(filters.search.toLowerCase())
          )
            return false;
          if (filters.priority !== "all" && t.priority !== filters.priority)
            return false;
          if (filters.assignee && t.assignee !== filters.assignee) return false;
          if (filters.label && !t.labels.includes(filters.label)) return false;
          return true;
        });
    },
    [state.tasks, filters],
  );

  const totalFilteredTasks = useMemo(() => {
    if (!board) return 0;
    return board.columns.reduce(
      (sum, col) => sum + filterTasks(col.taskIds).length,
      0,
    );
  }, [board, filterTasks]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      if (e.key === "n") {
        e.preventDefault();
        const btn = document.querySelector(
          "[data-add-task]",
        ) as HTMLButtonElement;
        btn?.click();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
        toast({ title: "Undo", description: "Reverted last action" });
      }
      if (e.key === "Escape") {
        setSelectedTasks([]);
        setSelectedTaskId(null);
      }
      if (e.key === "/") {
        e.preventDefault();
        const s = document.querySelector("[data-search]") as HTMLInputElement;
        s?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, toast]);

  const handleTaskClick = useCallback(
    (taskId: string) => {
      setSelectedTaskId(taskId);
      setIsNewTask(false);
      addRecentlyViewed(taskId);
    },
    [addRecentlyViewed],
  );

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Board not found</p>
          <Button onClick={() => navigate("/")} variant="secondary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const handleDrop =
    (toColumnId: string) => (taskId: string, fromColumnId: string) => {
      const col = board.columns.find((c) => c.id === toColumnId);
      const limit = board.wipLimits[toColumnId];
      if (limit && col && col.taskIds.length >= limit) {
        toast({
          title: "WIP Limit Reached",
          description: `"${col.title}" has a limit of ${limit} items.`,
          variant: "destructive",
        });
        return;
      }
      dispatch({
        type: "MOVE_TASK",
        payload: { taskId, fromColumnId, toColumnId, boardId: board.id },
      });
    };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim()) {
      dispatch({
        type: "ADD_COLUMN",
        payload: { boardId: board.id, title: newColumnTitle.trim() },
      });
      setNewColumnTitle("");
      setShowAddColumn(false);
    }
  };

  const toggleSelect = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleAddTask = (columnId: string, title: string) => {
    dispatch({
      type: "ADD_TASK",
      payload: { boardId: board.id, columnId, title },
    });
  };

  const handleArchiveColumn = (columnId: string) => {
    dispatch({
      type: "ARCHIVE_TASKS",
      payload: { boardId: board.id, columnId },
    });
    toast({ title: "Archived", description: "Tasks moved to archive." });
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskConfirm(taskId);
  };

  const confirmDeleteTask = () => {
    if (deleteTaskConfirm) {
      dispatch({
        type: "DELETE_TASK",
        payload: { taskId: deleteTaskConfirm, boardId: board.id },
      });
      toast({ title: "Deleted", description: "Task has been deleted." });
      setDeleteTaskConfirm(null);
    }
  };

  const selectedTask = selectedTaskId ? state.tasks[selectedTaskId] : null;

  const allFilteredTasks = useMemo(() => {
    if (!board) return [];
    return board.columns.flatMap((col) =>
      filterTasks(col.taskIds).map((task) => ({
        ...task,
        _columnId: col.id,
        _columnTitle: col.title,
      })),
    );
  }, [board, filterTasks]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b px-3 sm:px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1.5 text-muted-foreground shrink-0 h-8 w-8 sm:w-auto sm:h-auto p-0 sm:p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <LayoutDashboard className="w-5 h-5 text-primary shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground leading-tight truncate">
                {board.name}
              </h1>
              {board.description && (
                <p className="text-xs text-muted-foreground hidden sm:block truncate">
                  {board.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              {(
                [
                  ["board", Columns3],
                  ["list", List],
                  ["grid", LayoutGrid],
                ] as const
              ).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                undo();
                toast({ title: "Undo" });
              }}
              className="gap-1 text-xs text-muted-foreground hidden sm:flex"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </Button>
            <Button
              variant={isBulkMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() =>
                setSelectedTasks(isBulkMode ? [] : allTasks.map((t) => t.id))
              }
              className="gap-1 text-xs text-muted-foreground hidden sm:flex"
            >
              <MousePointer className="w-3.5 h-3.5" />
              {isBulkMode ? "Deselect" : "Select"}
            </Button>
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <Filters
            filters={filters}
            onChange={setFilters}
            assignees={assignees}
            labels={labels}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-3 sm:p-4 scrollbar-thin">
        {loading ? (
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-72 shrink-0 space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : hasActiveFilters && totalFilteredTasks === 0 ? (
          <EmptyState type="no-results" />
        ) : viewMode === "board" ? (
          <div className="flex gap-4 h-full items-start overflow-x-auto pb-4">
            {board.columns.map((col, idx) => (
              <Column
                key={col.id}
                column={col}
                tasks={filterTasks(col.taskIds)}
                boardId={board.id}
                wipLimit={board.wipLimits[col.id]}
                selectedTasks={selectedTasks}
                isBulkMode={isBulkMode}
                onDrop={handleDrop(col.id)}
                onTaskClick={handleTaskClick}
                onToggleSelect={toggleSelect}
                onAddTask={(title) => handleAddTask(col.id, title)}
                onArchive={() => handleArchiveColumn(col.id)}
                onRenameColumn={(title) =>
                  dispatch({
                    type: "RENAME_COLUMN",
                    payload: { boardId: board.id, columnId: col.id, title },
                  })
                }
                onDeleteColumn={() =>
                  dispatch({
                    type: "DELETE_COLUMN",
                    payload: { boardId: board.id, columnId: col.id },
                  })
                }
                onMoveColumn={(dir) => {
                  const toIndex = dir === "left" ? idx - 1 : idx + 1;
                  dispatch({
                    type: "REORDER_COLUMNS",
                    payload: { boardId: board.id, fromIndex: idx, toIndex },
                  });
                }}
                onDeleteTask={handleDeleteTask}
                viewMode="board"
                hasActiveFilters={hasActiveFilters}
                totalUnfilteredCount={col.taskIds.length}
                isFirst={idx === 0}
                isLast={idx === board.columns.length - 1}
              />
            ))}
            {/* Add Column */}
            <div className="w-72 shrink-0">
              {showAddColumn ? (
                <form
                  onSubmit={handleAddColumn}
                  className="bg-column rounded-xl border p-3"
                >
                  <Input
                    autoFocus
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setShowAddColumn(false);
                    }}
                    placeholder="Column name..."
                    className="bg-secondary/50 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      type="submit"
                      disabled={!newColumnTitle.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => setShowAddColumn(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddColumn(true)}
                  className="w-full flex items-center gap-2 rounded-xl border border-dashed border-border hover:border-primary/30 p-4 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Column
                </button>
              )}
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="border rounded-xl bg-card overflow-hidden overflow-x-auto">
            <div className="flex items-center gap-3 px-3 sm:px-4 py-2 border-b bg-secondary/30 text-xs font-medium text-muted-foreground min-w-[600px]">
              <span className="w-6" />
              <span className="w-6" />
              <span className="w-12">Priority</span>
              <span className="flex-1">Title</span>
              <span className="w-24 hidden sm:block">Status</span>
              <span className="w-20 hidden sm:block">Assignee</span>
              <span className="w-20 hidden sm:block">Due</span>
            </div>
            {allFilteredTasks.length === 0 ? (
              <EmptyState type="no-tasks" />
            ) : (
              allFilteredTasks.map((task) => {
                const daysSinceMoved = differenceInDays(
                  new Date(),
                  new Date(task.columnMovedAt),
                );
                const isStuck = daysSinceMoved >= 3;
                const prio = task.priority;
                const typeInfo = TASK_TYPES.find(
                  (t) => t.value === task.taskType,
                );
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className="group flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors min-w-[600px]"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({
                          type: "TOGGLE_STAR",
                          payload: { taskId: task.id },
                        });
                      }}
                      className="w-6 shrink-0"
                    >
                      <Star
                        className={cn(
                          "w-3.5 h-3.5",
                          task.starred
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30 hover:text-yellow-400",
                        )}
                      />
                    </button>
                    {typeInfo && (
                      <span
                        className="w-6 text-xs shrink-0"
                        title={typeInfo.label}
                      >
                        {typeInfo.emoji}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] w-12 justify-center",
                        prio === "P1"
                          ? "text-priority-p1 border-priority-p1/30"
                          : prio === "P2"
                            ? "text-priority-p2 border-priority-p2/30"
                            : "text-priority-p3 border-priority-p3/30",
                      )}
                    >
                      {prio}
                    </Badge>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium truncate text-foreground">
                        {task.title}
                      </span>
                      {isStuck && (
                        <Clock className="w-3 h-3 text-priority-p1 shrink-0" />
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="w-24 justify-center text-[10px] hidden sm:flex"
                    >
                      {task._columnTitle}
                    </Badge>
                    <span className="w-20 text-xs text-muted-foreground truncate hidden sm:block">
                      {task.assignee || "—"}
                    </span>
                    <span className="w-20 text-xs text-muted-foreground hidden sm:block">
                      {task.dueDate
                        ? format(new Date(task.dueDate), "MMM d")
                        : "—"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allFilteredTasks.length === 0 ? (
              <div className="col-span-full">
                <EmptyState type="no-tasks" />
              </div>
            ) : (
              allFilteredTasks.map((task) => {
                const daysSinceMoved = differenceInDays(
                  new Date(),
                  new Date(task.columnMovedAt),
                );
                const isStuck = daysSinceMoved >= 3;
                const typeInfo = TASK_TYPES.find(
                  (t) => t.value === task.taskType,
                );
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className={cn(
                      "group rounded-xl border bg-card p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-md animate-fade-in",
                      isStuck && "border-l-2 border-l-priority-p1",
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {task._columnTitle}
                        </Badge>
                        {typeInfo && (
                          <span className="text-xs">{typeInfo.emoji}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({
                              type: "TOGGLE_STAR",
                              payload: { taskId: task.id },
                            });
                          }}
                        >
                          <Star
                            className={cn(
                              "w-3.5 h-3.5",
                              task.starred
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30 hover:text-yellow-400",
                            )}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          task.priority === "P1"
                            ? "text-priority-p1"
                            : task.priority === "P2"
                              ? "text-priority-p2"
                              : "text-priority-p3",
                        )}
                      >
                        {task.priority}
                      </Badge>
                      {task.assignee && <span>{task.assignee}</span>}
                      {isStuck && (
                        <span className="text-priority-p1 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {daysSinceMoved}d
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <BulkActions
        boardId={board.id}
        selectedTasks={selectedTasks}
        onClear={() => setSelectedTasks([])}
      />
      <TaskModal
        task={selectedTask}
        boardId={board.id}
        open={!!selectedTaskId}
        onClose={() => {
          setSelectedTaskId(null);
          setIsNewTask(false);
        }}
        isNew={isNewTask}
      />

      {/* Delete Task Confirm */}
      <AlertDialog
        open={!!deleteTaskConfirm}
        onOpenChange={(v) => {
          if (!v) setDeleteTaskConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Keyboard Hints */}
      <footer className="border-t px-4 py-1.5 shrink-0 items-center gap-4 text-[10px] text-muted-foreground hidden sm:flex">
        <span>
          <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">N</kbd>{" "}
          New task
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">⌘Z</kbd>{" "}
          Undo
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">/</kbd>{" "}
          Search
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">Esc</kbd>{" "}
          Clear
        </span>
      </footer>
    </div>
  );
};

export default BoardPage;
