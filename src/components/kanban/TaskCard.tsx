import React from "react";
import type { Task, ViewMode } from "@/types/kanban";
import { TASK_TYPES } from "@/types/kanban";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, User, CheckSquare, Star, Clock, Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useKanban } from "@/context/KanbanContext";

interface TaskCardProps {
  task: Task;
  columnId: string;
  isSelected: boolean;
  isBulkMode: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onDelete?: () => void;
  viewMode?: ViewMode;
}

const priorityConfig = {
  P1: {
    label: "P1",
    className: "bg-priority-p1/15 text-priority-p1 border-priority-p1/30",
  },
  P2: {
    label: "P2",
    className: "bg-priority-p2/15 text-priority-p2 border-priority-p2/30",
  },
  P3: {
    label: "P3",
    className: "bg-priority-p3/15 text-priority-p3 border-priority-p3/30",
  },
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  columnId,
  isSelected,
  isBulkMode,
  onToggleSelect,
  onClick,
  onDelete,
  viewMode = "board",
}) => {
  const { dispatch } = useKanban();
  const prio = priorityConfig[task.priority];
  const completedSubs = task.subtasks.filter((s) => s.completed).length;
  const totalSubs = task.subtasks.length;
  const typeInfo = TASK_TYPES.find((t) => t.value === task.taskType);

  const daysSinceMoved = differenceInDays(
    new Date(),
    new Date(task.columnMovedAt),
  );
  const isStuck = daysSinceMoved >= 3;

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "TOGGLE_STAR", payload: { taskId: task.id } });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={(e) => {
          if (isBulkMode) {
            e.stopPropagation();
            onToggleSelect();
            return;
          }
          onClick();
        }}
        className={cn(
          "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-border/50 cursor-pointer transition-colors",
          "hover:bg-secondary/30",
          isSelected && "bg-primary/5",
        )}
      >
        {isBulkMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect()}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <button onClick={handleStar} className="shrink-0">
          <Star
            className={cn(
              "w-3.5 h-3.5",
              task.starred
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40 hover:text-yellow-400",
            )}
          />
        </button>
        {typeInfo && (
          <span className="text-xs shrink-0" title={typeInfo.label}>
            {typeInfo.emoji}
          </span>
        )}
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 h-5 font-semibold shrink-0",
            prio.className,
          )}
        >
          {prio.label}
        </Badge>
        <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
          {task.title}
        </span>
        {isStuck && (
          <span className="flex items-center gap-1 text-[10px] text-priority-p1 shrink-0">
            <Clock className="w-3 h-3" /> {daysSinceMoved}d
          </span>
        )}
        {task.assignee && (
          <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
            {task.assignee}
          </span>
        )}
        {task.dueDate && (
          <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
        {totalSubs > 0 && (
          <span className="text-[11px] text-muted-foreground shrink-0">
            {completedSubs}/{totalSubs}
          </span>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground/40 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "text/plain",
          JSON.stringify({ taskId: task.id, fromColumnId: columnId }),
        );
        e.dataTransfer.effectAllowed = "move";
        (e.target as HTMLElement).classList.add("drag-ghost");
      }}
      onDragEnd={(e) => {
        (e.target as HTMLElement).classList.remove("drag-ghost");
      }}
      onClick={(e) => {
        if (isBulkMode) {
          e.stopPropagation();
          onToggleSelect();
          return;
        }
        onClick();
      }}
      className={cn(
        "group rounded-lg border bg-card p-3 cursor-pointer transition-all duration-150",
        "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
        isSelected && "border-primary/50 bg-primary/5",
        isStuck && "border-l-2 border-l-priority-p1",
        "animate-fade-in",
      )}
    >
      <div className="flex items-start gap-2">
        {isBulkMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect()}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {typeInfo && (
                <span className="text-xs shrink-0" title={typeInfo.label}>
                  {typeInfo.emoji}
                </span>
              )}
              <p className="text-sm font-medium leading-snug text-foreground truncate">
                {task.title}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={handleStar} className="mt-0.5">
                <Star
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    task.starred
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-yellow-400",
                  )}
                />
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2
                    className={cn(
                      "w-3.5 h-3.5 text-muted-foreground/30 hover:text-destructive transition-colors",
                    )}
                  />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 h-5 font-semibold",
                prio.className,
              )}
            >
              {prio.label}
            </Badge>
            {task.labels.slice(0, 2).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 font-normal"
              >
                {label}
              </Badge>
            ))}
            {task.labels.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{task.labels.length - 2}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            {isStuck && (
              <span className="flex items-center gap-1 text-priority-p1">
                <Clock className="w-3 h-3" />
                {daysSinceMoved}d stuck
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.assignee}
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            {totalSubs > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                {completedSubs}/{totalSubs}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
