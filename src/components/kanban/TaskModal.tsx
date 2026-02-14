import React, { useState } from "react";
import { useKanban, getTaskColumn } from "@/context/KanbanContext";
import { useNavigate } from "react-router-dom";
import type { Task, Priority, TaskType } from "@/types/kanban";
import { TASK_TYPES } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Calendar as CalendarIcon,
  Trash2,
  Send,
  Plus,
  X,
  MessageSquare,
  History,
  CheckSquare,
  FileText,
  Star,
  Copy,
  ExternalLink,
  UserPlus,
  Pencil,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TaskModalProps {
  task: Task | null;
  boardId: string;
  open: boolean;
  onClose: () => void;
  isNew?: boolean;
}

const priorityOptions: { value: Priority; label: string; className: string }[] =
  [
    { value: "P1", label: "P1 — Critical", className: "text-priority-p1" },
    { value: "P2", label: "P2 — Medium", className: "text-priority-p2" },
    { value: "P3", label: "P3 — Low", className: "text-priority-p3" },
  ];

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  boardId,
  open,
  onClose,
  isNew = false,
}) => {
  const { state, dispatch } = useKanban();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");

  if (!task) return null;

  const column = getTaskColumn(state, task.id, boardId);

  const update = (updates: Partial<Task>, desc?: string) => {
    dispatch({
      type: "UPDATE_TASK",
      payload: { taskId: task.id, updates, changeDescription: desc },
    });
  };

  const handleDelete = () => {
    dispatch({ type: "DELETE_TASK", payload: { taskId: task.id, boardId } });
    onClose();
  };

  const handleDuplicate = () => {
    dispatch({ type: "DUPLICATE_TASK", payload: { taskId: task.id, boardId } });
    toast({
      title: "Task Duplicated",
      description: `"${task.title}" has been duplicated.`,
    });
    onClose();
  };

  const handleStar = () => {
    dispatch({ type: "TOGGLE_STAR", payload: { taskId: task.id } });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      dispatch({
        type: "ADD_COMMENT",
        payload: { taskId: task.id, text: commentText.trim(), author: "You" },
      });
      setCommentText("");
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskTitle.trim()) {
      dispatch({
        type: "ADD_SUBTASK",
        payload: { taskId: task.id, title: subtaskTitle.trim() },
      });
      setSubtaskTitle("");
    }
  };

  const handleAddLabel = (e: React.KeyboardEvent) => {
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
  };

  const handleRemoveLabel = (label: string) => {
    update(
      { labels: task.labels.filter((l) => l !== label) },
      `Removed label "${label}"`,
    );
  };

  const handleMoveToColumn = (columnId: string) => {
    if (column && column.id !== columnId) {
      dispatch({
        type: "MOVE_TASK",
        payload: {
          taskId: task.id,
          fromColumnId: column.id,
          toColumnId: columnId,
          boardId,
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

  const board = state.boards.find((b) => b.id === boardId);
  const typeInfo = TASK_TYPES.find((t) => t.value === task.taskType);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-card border-border w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          <div className="flex items-center gap-2">
            <input
              value={task.title}
              onChange={(e) => update({ title: e.target.value })}
              onBlur={(e) => {
                if (e.target.value !== task.title)
                  update({}, `Renamed to "${e.target.value}"`);
              }}
              className="text-base sm:text-lg font-semibold bg-transparent border-none outline-none flex-1 text-foreground min-w-0"
            />
            <button onClick={handleStar} className="shrink-0">
              <Star
                className={cn(
                  "w-4 h-4",
                  task.starred
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground hover:text-yellow-400",
                )}
              />
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={() => {
                onClose();
                navigate(`/task/${task.id}`);
              }}
              title="Open full page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Status Row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Task Type */}
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
                "text-[10px]",
                priorityOptions.find((p) => p.value === task.priority)
                  ?.className,
              )}
            >
              {task.priority}
            </Badge>
            {task.assignee && (
              <span className="text-xs text-muted-foreground">
                {task.assignee}
              </span>
            )}
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="details"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="bg-secondary/50 shrink-0 flex-wrap h-auto">
            <TabsTrigger value="details" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="subtasks" className="gap-1.5 text-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Subtasks</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs">
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto scrollbar-thin mt-4">
            {/* Details */}
            <TabsContent value="details" className="space-y-4 m-0">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Description
                </label>
                <Textarea
                  value={task.description}
                  onChange={(e) => update({ description: e.target.value })}
                  onBlur={() => update({}, "Updated description")}
                  placeholder="Add a description..."
                  className="min-h-[80px] bg-secondary/50 border-border resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Assignee
                </label>
                <div className="flex gap-1">
                  <Input
                    value={task.assignee}
                    onChange={(e) => update({ assignee: e.target.value })}
                    onBlur={() => {
                      if (task.assignee)
                        update({}, `Assigned to ${task.assignee}`);
                    }}
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
                        onClick={() => handleRemoveLabel(label)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={handleAddLabel}
                  placeholder="Type label and press Enter..."
                  className="bg-secondary/50"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t flex items-center gap-2 flex-wrap">
                {isNew ? (
                  <Button size="sm" onClick={onClose} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Done Creating
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDuplicate}
                      className="gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </Button>
                    <div className="flex-1" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Task
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{task.title}". This
                            action cannot be undone.
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
                  </>
                )}
              </div>
            </TabsContent>

            {/* Subtasks */}
            <TabsContent value="subtasks" className="space-y-2 m-0">
              {task.subtasks.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>
                      {task.subtasks.filter((s) => s.completed).length}/
                      {task.subtasks.length} completed
                    </span>
                    <span>
                      {Math.round(
                        (task.subtasks.filter((s) => s.completed).length /
                          task.subtasks.length) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className="bg-success h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {task.subtasks.length === 0 && <EmptySubtasks />}
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="group/sub flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50"
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
                  <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEditSubtask(sub)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "DELETE_SUBTASK",
                          payload: { taskId: task.id, subtaskId: sub.id },
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
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
            </TabsContent>

            {/* Comments */}
            <TabsContent value="comments" className="space-y-3 m-0">
              {task.comments.length === 0 && (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No comments yet
                  </p>
                </div>
              )}
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
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
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
            </TabsContent>

            {/* Activity */}
            <TabsContent value="activity" className="m-0">
              {task.activity.length === 0 && (
                <div className="text-center py-6">
                  <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No activity yet
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {[...task.activity].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{entry.user}</span>{" "}
                        <span className="text-muted-foreground">
                          {entry.detail}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(entry.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const EmptySubtasks = () => (
  <div className="text-center py-6">
    <CheckSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">No subtasks yet</p>
  </div>
);

export default TaskModal;
