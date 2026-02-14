import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKanban, getTaskColumn } from "@/context/KanbanContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import type { Task, Priority, TaskType } from "@/types/kanban";
import { TASK_TYPES } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Trash2,
  Send,
  Plus,
  X,
  Star,
  Copy,
  UserPlus,
  Clock,
  CheckSquare,
  Pencil,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const priorityOptions: { value: Priority; label: string; className: string }[] =
  [
    { value: "P1", label: "P1 — Critical", className: "text-priority-p1" },
    { value: "P2", label: "P2 — Medium", className: "text-priority-p2" },
    { value: "P3", label: "P3 — Low", className: "text-priority-p3" },
  ];

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useKanban();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");

  const task = taskId ? state.tasks[taskId] : null;

  useEffect(() => {
    if (taskId) addRecentlyViewed(taskId);
  }, [taskId, addRecentlyViewed]);

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Task not found</p>
          <Button onClick={() => navigate("/")} variant="secondary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const board = state.boards.find((b) => b.id === task.boardId);
  const column = getTaskColumn(state, task.id, task.boardId);
  const daysSinceMoved = differenceInDays(
    new Date(),
    new Date(task.columnMovedAt),
  );
  const isStuck = daysSinceMoved >= 3;
  const typeInfo = TASK_TYPES.find((t) => t.value === task.taskType);

  const update = (updates: Partial<Task>, desc?: string) => {
    dispatch({
      type: "UPDATE_TASK",
      payload: { taskId: task.id, updates, changeDescription: desc },
    });
  };

  const handleDelete = () => {
    dispatch({
      type: "DELETE_TASK",
      payload: { taskId: task.id, boardId: task.boardId },
    });
    navigate(board ? `/board/${board.id}` : "/");
  };

  const handleDuplicate = () => {
    dispatch({
      type: "DUPLICATE_TASK",
      payload: { taskId: task.id, boardId: task.boardId },
    });
    toast({
      title: "Task Duplicated",
      description: `"${task.title}" has been duplicated.`,
    });
  };

  const handleMoveToColumn = (columnId: string) => {
    if (column && column.id !== columnId) {
      dispatch({
        type: "MOVE_TASK",
        payload: {
          taskId: task.id,
          fromColumnId: column.id,
          toColumnId: columnId,
          boardId: task.boardId,
        },
      });
    }
  };

  const handleStartEditSubtask = (sub: { id: string; title: string }) => {
    setEditingSubtaskId(sub.id);
    setEditingSubtaskTitle(sub.title);
  };

  const handleSaveSubtaskEdit = () => {
    if (editingSubtaskId && editingSubtaskTitle.trim()) {
      dispatch({
        type: "UPDATE_SUBTASK",
        payload: {
          taskId: task.id,
          subtaskId: editingSubtaskId,
          title: editingSubtaskTitle.trim(),
        },
      });
    }
    setEditingSubtaskId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 sm:px-6 py-3 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-muted-foreground min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(board ? `/board/${board.id}` : "/")}
              className="gap-1.5 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Back</span>
            </Button>
            <span className="hidden sm:inline">/</span>
            {board && (
              <button
                onClick={() => navigate(`/board/${board.id}`)}
                className="hover:text-foreground transition-colors hidden sm:inline truncate max-w-[150px]"
              >
                {board.name}
              </button>
            )}
            <span className="hidden sm:inline">/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {task.title}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="flex items-start gap-3">
              <button
                onClick={() =>
                  dispatch({
                    type: "TOGGLE_STAR",
                    payload: { taskId: task.id },
                  })
                }
                className="shrink-0"
              >
                <Star
                  className={cn(
                    "w-5 h-5 mt-1",
                    task.starred
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-400",
                  )}
                />
              </button>
              <input
                value={task.title}
                onChange={(e) => update({ title: e.target.value })}
                className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none flex-1 text-foreground min-w-0"
              />
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type */}
              <Select
                value={task.taskType}
                onValueChange={(v: TaskType) =>
                  update({ taskType: v }, `Changed type to ${v}`)
                }
              >
                <SelectTrigger className="h-7 w-auto bg-secondary/50 text-xs font-medium px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span>
                        {t.emoji} {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {column && (
                <Select value={column.id} onValueChange={handleMoveToColumn}>
                  <SelectTrigger className="h-7 w-auto bg-primary/10 text-primary text-xs font-medium border-primary/20 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {board?.columns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  priorityOptions.find((p) => p.value === task.priority)
                    ?.className,
                )}
              >
                {task.priority}
              </Badge>
              {isStuck && (
                <Badge
                  variant="outline"
                  className="text-xs text-priority-p1 border-priority-p1/30"
                >
                  <Clock className="w-3 h-3 mr-1" /> {daysSinceMoved}d in column
                </Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Description
              </h3>
              <Textarea
                value={task.description}
                onChange={(e) => update({ description: e.target.value })}
                onBlur={() => update({}, "Updated description")}
                placeholder="Add a detailed description..."
                className="min-h-[120px] bg-secondary/50 border-border resize-none"
              />
            </div>

            {/* Subtasks - Enhanced View */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Subtasks
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {task.subtasks.filter((s) => s.completed).length}/
                    {task.subtasks.length}
                  </span>
                )}
              </h3>
              {task.subtasks.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.round(
                        (task.subtasks.filter((s) => s.completed).length /
                          task.subtasks.length) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-success h-2 rounded-full transition-all"
                      style={{
                        width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="group/sub flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-secondary/30 transition-colors"
                  >
                    <Checkbox
                      checked={sub.completed}
                      onCheckedChange={() =>
                        dispatch({
                          type: "TOGGLE_SUBTASK",
                          payload: { taskId: task.id, subtaskId: sub.id },
                        })
                      }
                    />
                    {editingSubtaskId === sub.id ? (
                      <Input
                        autoFocus
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        onBlur={handleSaveSubtaskEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSubtaskEdit();
                          if (e.key === "Escape") setEditingSubtaskId(null);
                        }}
                        className="h-7 text-sm flex-1 bg-secondary/50"
                      />
                    ) : (
                      <span
                        className={cn(
                          "text-sm flex-1 cursor-pointer",
                          sub.completed && "line-through text-muted-foreground",
                        )}
                        onDoubleClick={() => handleStartEditSubtask(sub)}
                      >
                        {sub.title}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleStartEditSubtask(sub)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          dispatch({
                            type: "DELETE_SUBTASK",
                            payload: { taskId: task.id, subtaskId: sub.id },
                          })
                        }
                        className="p-1 text-muted-foreground hover:text-destructive rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (subtaskTitle.trim()) {
                    dispatch({
                      type: "ADD_SUBTASK",
                      payload: { taskId: task.id, title: subtaskTitle.trim() },
                    });
                    setSubtaskTitle("");
                  }
                }}
                className="flex gap-2 mt-3"
              >
                <Input
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Add subtask..."
                  className="bg-secondary/50 flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={!subtaskTitle.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Comments
              </h3>
              <div className="space-y-3 mb-3">
                {task.comments.map((c) => (
                  <div key={c.id} className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {c.author[0]}
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {c.author}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-foreground ml-8">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) {
                    dispatch({
                      type: "ADD_COMMENT",
                      payload: {
                        taskId: task.id,
                        text: commentText.trim(),
                        author: "You",
                      },
                    });
                    setCommentText("");
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="bg-secondary/50 flex-1"
                />
                <Button type="submit" size="sm" disabled={!commentText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Activity */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Activity
              </h3>
              <div className="space-y-1 border-l-2 border-border ml-2 pl-4">
                {[...task.activity].reverse().map((entry) => (
                  <div key={entry.id} className="relative py-2">
                    <div className="absolute -left-[21px] top-3 w-2 h-2 rounded-full bg-primary" />
                    <p className="text-sm">
                      <span className="font-medium text-foreground">
                        {entry.user}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {entry.detail}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="border rounded-xl p-4 bg-card space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Type
                </label>
                <Select
                  value={task.taskType}
                  onValueChange={(v: TaskType) =>
                    update({ taskType: v }, `Changed type to ${v}`)
                  }
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span>
                          {t.emoji} {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Priority
                </label>
                <Select
                  value={task.priority}
                  onValueChange={(v: Priority) =>
                    update({ priority: v }, `Changed priority to ${v}`)
                  }
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.className}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Assignee
                </label>
                <div className="flex gap-1">
                  <Input
                    value={task.assignee}
                    onChange={(e) => update({ assignee: e.target.value })}
                    placeholder="Assign to..."
                    className="bg-secondary/50 flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0 h-9 px-2"
                    onClick={() =>
                      update({ assignee: "You" }, "Auto-assigned to You")
                    }
                    title="Assign to me"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Due Date
                </label>
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left bg-secondary/50",
                        !task.dueDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {task.dueDate
                        ? format(new Date(task.dueDate), "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        task.dueDate ? new Date(task.dueDate) : undefined
                      }
                      onSelect={(date) => {
                        update(
                          { dueDate: date?.toISOString() ?? null },
                          date
                            ? `Set due date to ${format(date, "MMM d")}`
                            : "Removed due date",
                        );
                        setDueDateOpen(false);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Labels
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {task.labels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {label}
                      <button
                        onClick={() =>
                          update(
                            { labels: task.labels.filter((l) => l !== label) },
                            `Removed label "${label}"`,
                          )
                        }
                      >
                        <X className="w-3 h-3 hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && labelInput.trim()) {
                      e.preventDefault();
                      if (!task.labels.includes(labelInput.trim())) {
                        update(
                          { labels: [...task.labels, labelInput.trim()] },
                          `Added label "${labelInput.trim()}"`,
                        );
                      }
                      setLabelInput("");
                    }
                  }}
                  placeholder="Type label + Enter..."
                  className="bg-secondary/50"
                />
              </div>

              <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t">
                <p>
                  Created{" "}
                  {formatDistanceToNow(new Date(task.createdAt), {
                    addSuffix: true,
                  })}
                </p>
                <p>
                  Updated{" "}
                  {formatDistanceToNow(new Date(task.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="border rounded-xl p-4 bg-card space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-1.5 justify-start"
                onClick={handleDuplicate}
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate Task
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1.5 justify-start"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Task
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{task.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetailPage;
