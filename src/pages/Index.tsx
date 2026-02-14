import React, { useState, useMemo } from "react";
import { useKanban } from "@/context/KanbanContext";
import { useNavigate } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import CreateBoardDialog from "@/components/kanban/CreateBoardDialog";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Plus,
  LayoutDashboard,
  Columns3,
  ListTodo,
  Trash2,
  Star,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const Index: React.FC = () => {
  const { state, dispatch } = useKanban();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { recentlyViewed } = useRecentlyViewed();

  const allTasks = useMemo(() => Object.values(state.tasks), [state.tasks]);

  const stats = useMemo(() => {
    const total = allTasks.length;
    const priority = allTasks.filter((t) => t.priority === "P1").length;
    const overdue = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date(),
    ).length;
    const starred = allTasks.filter((t) => t.starred).length;
    const stuck = allTasks.filter(
      (t) => differenceInDays(new Date(), new Date(t.columnMovedAt)) >= 3,
    ).length;
    return { total, priority, overdue, starred, stuck };
  }, [allTasks]);

  const recentTasks = useMemo(() => {
    return recentlyViewed
      .map((id) => state.tasks[id])
      .filter(Boolean)
      .slice(0, 5);
  }, [recentlyViewed, state.tasks]);

  const filteredBoards = useMemo(() => {
    if (!searchQuery) return state.boards;
    return state.boards.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [state.boards, searchQuery]);

  const getBoardStats = (boardId: string) => {
    const tasks = allTasks.filter((t) => t.boardId === boardId);
    return {
      taskCount: tasks.length,
      columnCount:
        state.boards.find((b) => b.id === boardId)?.columns.length ?? 0,
      p1Count: tasks.filter((t) => t.priority === "P1").length,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              TaskFlow
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards & tasks..."
                className="pl-9 h-9 w-48 lg:w-64 bg-secondary/50"
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
        {/* Mobile search */}
        <div className="sm:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards..."
              className="pl-9 h-9 bg-secondary/50"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stats Cards */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
            My Tasks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Priority Tasks",
                value: stats.priority,
                total: stats.total,
                icon: AlertCircle,
                color: "text-priority-p1",
                bg: "bg-priority-p1/10",
              },
              {
                label: "Starred",
                value: stats.starred,
                total: stats.total,
                icon: Star,
                color: "text-yellow-500",
                bg: "bg-yellow-500/10",
              },
              {
                label: "Overdue",
                value: stats.overdue,
                total: stats.total,
                icon: Clock,
                color: "text-priority-p2",
                bg: "bg-priority-p2/10",
              },
              {
                label: "Stuck (3d+)",
                value: stats.stuck,
                total: stats.total,
                icon: CheckCircle2,
                color: "text-priority-p1",
                bg: "bg-priority-p1/10",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border bg-card p-3 sm:p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center",
                      card.bg,
                    )}
                  >
                    <card.icon
                      className={cn("w-4 h-4 sm:w-5 sm:h-5", card.color)}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    {card.label}
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {card.value}
                  <span className="text-xs sm:text-sm text-muted-foreground font-normal">
                    /{card.total}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Viewed */}
        {recentTasks.length > 0 && (
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentTasks.map((task) => {
                const board = state.boards.find((b) => b.id === task.boardId);
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/task/${task.id}`)}
                    className="rounded-xl border bg-card p-3 sm:p-4 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all animate-fade-in"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {board?.name}
                      </Badge>
                      {task.starred && (
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1 truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Boards */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Your Boards
            </h2>
            <Button
              onClick={() => setShowCreate(true)}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">New Board</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredBoards.map((board) => {
              const boardStats = getBoardStats(board.id);
              return (
                <div
                  key={board.id}
                  className="group relative rounded-xl border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer animate-fade-in"
                  onClick={() => navigate(`/board/${board.id}`)}
                >
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-foreground mb-1">
                      {board.name}
                    </h3>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                        {board.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Columns3 className="w-3.5 h-3.5" />
                        {boardStats.columnCount} cols
                      </span>
                      <span className="flex items-center gap-1">
                        <ListTodo className="w-3.5 h-3.5" />
                        {boardStats.taskCount} tasks
                      </span>
                      {boardStats.p1Count > 0 && (
                        <span className="flex items-center gap-1 text-priority-p1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {boardStats.p1Count} P1
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/board/${board.id}`);
                      }}
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete "{board.name}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            All tasks in this board will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              dispatch({
                                type: "DELETE_BOARD",
                                payload: { boardId: board.id },
                              })
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setShowCreate(true)}
              className="rounded-xl border border-dashed border-border hover:border-primary/30 bg-transparent flex flex-col items-center justify-center gap-2 p-6 sm:p-8 text-muted-foreground hover:text-primary transition-colors min-h-[120px] sm:min-h-[140px]"
            >
              <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="text-sm font-medium">Create Board</span>
            </button>
          </div>
        </div>
      </main>

      <CreateBoardDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
};

export default Index;
