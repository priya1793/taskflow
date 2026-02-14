import React, { useState } from "react";
import { useKanban, useBoard } from "@/context/KanbanContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { X, Trash2, ArrowRight, UserPlus } from "lucide-react";

interface BulkActionsProps {
  boardId: string;
  selectedTasks: string[];
  onClear: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  boardId,
  selectedTasks,
  onClear,
}) => {
  const { dispatch } = useKanban();
  const board = useBoard(boardId);
  const [assignee, setAssignee] = useState("");

  if (!board || selectedTasks.length === 0) return null;

  const handleMove = (toColumnId: string) => {
    dispatch({
      type: "BULK_MOVE",
      payload: { taskIds: selectedTasks, toColumnId, boardId },
    });
    onClear();
  };

  const handleDelete = () => {
    dispatch({
      type: "BULK_DELETE",
      payload: { taskIds: selectedTasks, boardId },
    });
    onClear();
  };

  const handleAssign = () => {
    if (assignee.trim()) {
      dispatch({
        type: "BULK_ASSIGN",
        payload: { taskIds: selectedTasks, assignee: assignee.trim() },
      });
      setAssignee("");
      onClear();
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-card border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-xl animate-fade-in max-w-[95vw]">
      <span className="text-xs sm:text-sm font-medium text-foreground shrink-0">
        {selectedTasks.length} sel.
      </span>

      <div className="h-5 w-px bg-border hidden sm:block" />

      <Select onValueChange={handleMove}>
        <SelectTrigger className="h-8 w-24 sm:w-32 bg-secondary/50 text-xs">
          <ArrowRight className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Move..." />
        </SelectTrigger>
        <SelectContent>
          {board.columns.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="items-center gap-1 hidden sm:flex">
        <Input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assign..."
          className="h-8 w-24 bg-secondary/50 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAssign();
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={handleAssign}
          disabled={!assignee.trim()}
          className="h-8"
        >
          <UserPlus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" className="h-8 gap-1">
            <Trash2 className="w-3.5 h-3.5" />{" "}
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedTasks.length} tasks?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button size="sm" variant="ghost" onClick={onClear} className="h-8">
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default BulkActions;
