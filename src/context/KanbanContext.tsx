import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type {
  Board,
  Task,
  KanbanState,
  Priority,
  TaskType,
} from "@/types/kanban";

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();

function migrateTask(t: any): Task {
  return {
    ...t,
    starred: t.starred ?? false,
    columnMovedAt: t.columnMovedAt ?? t.createdAt ?? now(),
    taskType: t.taskType ?? "task",
  };
}

function migrateBoard(b: any): Board {
  return {
    ...b,
    archivedTaskIds: b.archivedTaskIds ?? [],
  };
}

function createSeedData(): KanbanState {
  const boardId = "board-1";
  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000 - 1,
  ).toISOString();
  const mk = (
    id: string,
    title: string,
    desc: string,
    p: Priority,
    assignee: string,
    labels: string[],
    taskType: TaskType = "task",
    movedAt?: string,
  ): Task => ({
    id,
    boardId,
    title,
    description: desc,
    priority: p,
    assignee,
    taskType,
    dueDate: null,
    labels,
    subtasks: [],
    comments: [],
    activity: [
      {
        id: uid(),
        action: "created",
        detail: "Task created",
        timestamp: now(),
        user: assignee,
      },
    ],
    starred: false,
    columnMovedAt: movedAt ?? now(),
    createdAt: now(),
    updatedAt: now(),
  });

  const tasks: Record<string, Task> = {};
  [
    mk(
      "t1",
      "Set up CI/CD pipeline",
      "Configure GitHub Actions for automated testing and deployment",
      "P1",
      "Alice",
      ["devops"],
      "task",
    ),
    mk(
      "t2",
      "Design landing page",
      "Create high-fidelity mockups for the new landing page",
      "P2",
      "Bob",
      ["design", "frontend"],
      "story",
    ),
    mk(
      "t3",
      "Implement auth flow",
      "Add login, signup, and password reset functionality",
      "P1",
      "Charlie",
      ["backend", "auth"],
      "epic",
      threeDaysAgo,
    ),
    mk(
      "t4",
      "Write API docs",
      "Document all REST endpoints with examples",
      "P3",
      "Alice",
      ["docs"],
      "task",
    ),
    mk(
      "t5",
      "Add dark mode",
      "Implement theme switching with system preference detection",
      "P2",
      "Bob",
      ["frontend"],
      "story",
    ),
    mk(
      "t6",
      "Database optimization",
      "Add indexes and optimize slow queries",
      "P1",
      "Charlie",
      ["backend", "performance"],
      "spike",
      threeDaysAgo,
    ),
    mk(
      "t7",
      "User feedback widget",
      "In-app feedback collection with screenshots",
      "P3",
      "Alice",
      ["frontend", "ux"],
      "story",
    ),
    mk(
      "t8",
      "E2E test suite",
      "Set up Playwright tests for critical user flows",
      "P2",
      "Charlie",
      ["testing"],
      "task",
    ),
  ].forEach((t) => {
    tasks[t.id] = t;
  });

  tasks["t3"].subtasks = [
    { id: "s1", title: "Login form UI", completed: true },
    { id: "s2", title: "JWT token handling", completed: true },
    { id: "s3", title: "Password reset flow", completed: false },
  ];
  tasks["t3"].comments = [
    {
      id: "c1",
      author: "Alice",
      text: "Should we use OAuth2 or session-based auth?",
      createdAt: now(),
    },
    {
      id: "c2",
      author: "Charlie",
      text: "Going with JWT + refresh tokens for the API.",
      createdAt: now(),
    },
  ];
  tasks["t1"].starred = true;

  return {
    boards: [
      {
        id: boardId,
        name: "Product Roadmap",
        description: "Main product development board",
        columns: [
          { id: "backlog", title: "Backlog", taskIds: ["t7", "t8"] },
          { id: "todo", title: "To Do", taskIds: ["t4", "t5"] },
          { id: "in-progress", title: "In Progress", taskIds: ["t3", "t6"] },
          { id: "review", title: "Review", taskIds: ["t2"] },
          { id: "done", title: "Done", taskIds: ["t1"] },
        ],
        wipLimits: { "in-progress": 5 },
        archivedTaskIds: [],
        createdAt: now(),
      },
    ],
    tasks,
  };
}

type KanbanAction =
  | { type: "ADD_BOARD"; payload: { name: string; description: string } }
  | { type: "DELETE_BOARD"; payload: { boardId: string } }
  | { type: "ADD_COLUMN"; payload: { boardId: string; title: string } }
  | { type: "DELETE_COLUMN"; payload: { boardId: string; columnId: string } }
  | {
      type: "RENAME_COLUMN";
      payload: { boardId: string; columnId: string; title: string };
    }
  | {
      type: "REORDER_COLUMNS";
      payload: { boardId: string; fromIndex: number; toIndex: number };
    }
  | {
      type: "ADD_TASK";
      payload: { boardId: string; columnId: string; title: string };
    }
  | {
      type: "UPDATE_TASK";
      payload: {
        taskId: string;
        updates: Partial<Task>;
        changeDescription?: string;
      };
    }
  | { type: "DELETE_TASK"; payload: { taskId: string; boardId: string } }
  | {
      type: "MOVE_TASK";
      payload: {
        taskId: string;
        fromColumnId: string;
        toColumnId: string;
        boardId: string;
      };
    }
  | {
      type: "ADD_COMMENT";
      payload: { taskId: string; text: string; author: string };
    }
  | { type: "ADD_SUBTASK"; payload: { taskId: string; title: string } }
  | { type: "TOGGLE_SUBTASK"; payload: { taskId: string; subtaskId: string } }
  | {
      type: "UPDATE_SUBTASK";
      payload: { taskId: string; subtaskId: string; title: string };
    }
  | { type: "DELETE_SUBTASK"; payload: { taskId: string; subtaskId: string } }
  | {
      type: "SET_WIP_LIMIT";
      payload: { boardId: string; columnId: string; limit: number };
    }
  | {
      type: "BULK_MOVE";
      payload: { taskIds: string[]; toColumnId: string; boardId: string };
    }
  | { type: "BULK_DELETE"; payload: { taskIds: string[]; boardId: string } }
  | { type: "BULK_ASSIGN"; payload: { taskIds: string[]; assignee: string } }
  | { type: "TOGGLE_STAR"; payload: { taskId: string } }
  | { type: "DUPLICATE_TASK"; payload: { taskId: string; boardId: string } }
  | { type: "ARCHIVE_TASKS"; payload: { boardId: string; columnId: string } }
  | { type: "RESTORE"; payload: KanbanState };

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case "ADD_BOARD": {
      const { name, description } = action.payload;
      return {
        ...state,
        boards: [
          ...state.boards,
          {
            id: `board-${uid()}`,
            name,
            description,
            columns: [
              { id: `col-${uid()}`, title: "To Do", taskIds: [] },
              { id: `col-${uid()}`, title: "In Progress", taskIds: [] },
              { id: `col-${uid()}`, title: "Done", taskIds: [] },
            ],
            wipLimits: {},
            archivedTaskIds: [],
            createdAt: now(),
          },
        ],
      };
    }
    case "DELETE_BOARD": {
      const { boardId } = action.payload;
      const remaining = { ...state.tasks };
      Object.keys(remaining).forEach((id) => {
        if (remaining[id].boardId === boardId) delete remaining[id];
      });
      return {
        ...state,
        boards: state.boards.filter((b) => b.id !== boardId),
        tasks: remaining,
      };
    }
    case "ADD_COLUMN": {
      const { boardId, title } = action.payload;
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: [
                  ...b.columns,
                  { id: `col-${uid()}`, title, taskIds: [] },
                ],
              },
        ),
      };
    }
    case "DELETE_COLUMN": {
      const { boardId, columnId } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      const col = board?.columns.find((c) => c.id === columnId);
      const remaining = { ...state.tasks };
      col?.taskIds.forEach((id) => delete remaining[id]);
      return {
        ...state,
        tasks: remaining,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.filter((c) => c.id !== columnId),
              },
        ),
      };
    }
    case "RENAME_COLUMN": {
      const { boardId, columnId, title } = action.payload;
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.map((c) =>
                  c.id !== columnId ? c : { ...c, title },
                ),
              },
        ),
      };
    }
    case "REORDER_COLUMNS": {
      const { boardId, fromIndex, toIndex } = action.payload;
      return {
        ...state,
        boards: state.boards.map((b) => {
          if (b.id !== boardId) return b;
          const cols = [...b.columns];
          const [removed] = cols.splice(fromIndex, 1);
          cols.splice(toIndex, 0, removed);
          return { ...b, columns: cols };
        }),
      };
    }
    case "ADD_TASK": {
      const { boardId, columnId, title } = action.payload;
      const taskId = `task-${uid()}`;
      const newTask: Task = {
        id: taskId,
        boardId,
        title,
        description: "",
        priority: "P3",
        taskType: "task",
        assignee: "",
        dueDate: null,
        labels: [],
        subtasks: [],
        comments: [],
        activity: [
          {
            id: uid(),
            action: "created",
            detail: "Task created",
            timestamp: now(),
            user: "You",
          },
        ],
        starred: false,
        columnMovedAt: now(),
        createdAt: now(),
        updatedAt: now(),
      };
      return {
        ...state,
        tasks: { ...state.tasks, [taskId]: newTask },
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.map((c) =>
                  c.id !== columnId
                    ? c
                    : { ...c, taskIds: [...c.taskIds, taskId] },
                ),
              },
        ),
      };
    }
    case "UPDATE_TASK": {
      const { taskId, updates, changeDescription } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      const entry = changeDescription
        ? {
            id: uid(),
            action: "updated",
            detail: changeDescription,
            timestamp: now(),
            user: "You",
          }
        : null;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            ...updates,
            updatedAt: now(),
            activity: entry ? [...task.activity, entry] : task.activity,
          },
        },
      };
    }
    case "DELETE_TASK": {
      const { taskId, boardId } = action.payload;
      const { [taskId]: _, ...remaining } = state.tasks;
      return {
        ...state,
        tasks: remaining,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.map((c) => ({
                  ...c,
                  taskIds: c.taskIds.filter((id) => id !== taskId),
                })),
              },
        ),
      };
    }
    case "MOVE_TASK": {
      const { taskId, fromColumnId, toColumnId, boardId } = action.payload;
      if (fromColumnId === toColumnId) return state;
      const board = state.boards.find((b) => b.id === boardId);
      const fromTitle =
        board?.columns.find((c) => c.id === fromColumnId)?.title ??
        fromColumnId;
      const toTitle =
        board?.columns.find((c) => c.id === toColumnId)?.title ?? toColumnId;
      const task = state.tasks[taskId];
      if (!task) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            updatedAt: now(),
            columnMovedAt: now(),
            activity: [
              ...task.activity,
              {
                id: uid(),
                action: "moved",
                detail: `Moved from "${fromTitle}" to "${toTitle}"`,
                timestamp: now(),
                user: "You",
              },
            ],
          },
        },
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.map((c) => {
                  if (c.id === fromColumnId)
                    return {
                      ...c,
                      taskIds: c.taskIds.filter((id) => id !== taskId),
                    };
                  if (c.id === toColumnId)
                    return { ...c, taskIds: [...c.taskIds, taskId] };
                  return c;
                }),
              },
        ),
      };
    }
    case "ADD_COMMENT": {
      const { taskId, text, author } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            updatedAt: now(),
            comments: [
              ...task.comments,
              { id: uid(), author, text, createdAt: now() },
            ],
            activity: [
              ...task.activity,
              {
                id: uid(),
                action: "commented",
                detail: text.slice(0, 60),
                timestamp: now(),
                user: author,
              },
            ],
          },
        },
      };
    }
    case "ADD_SUBTASK": {
      const { taskId, title } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            updatedAt: now(),
            subtasks: [
              ...task.subtasks,
              { id: uid(), title, completed: false },
            ],
          },
        },
      };
    }
    case "TOGGLE_SUBTASK": {
      const { taskId, subtaskId } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      const sub = task.subtasks.find((s) => s.id === subtaskId);
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            updatedAt: now(),
            subtasks: task.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, completed: !s.completed } : s,
            ),
            activity: [
              ...task.activity,
              {
                id: uid(),
                action: "subtask",
                detail: `${sub?.completed ? "Unchecked" : "Checked"} "${sub?.title}"`,
                timestamp: now(),
                user: "You",
              },
            ],
          },
        },
      };
    }
    case "UPDATE_SUBTASK": {
      const { taskId, subtaskId, title } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            updatedAt: now(),
            subtasks: task.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, title } : s,
            ),
          },
        },
      };
    }
    case "DELETE_SUBTASK": {
      const { taskId, subtaskId } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      const sub = task.subtasks.find((s) => s.id === subtaskId);
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            updatedAt: now(),
            subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
            activity: [
              ...task.activity,
              {
                id: uid(),
                action: "subtask",
                detail: `Deleted subtask "${sub?.title}"`,
                timestamp: now(),
                user: "You",
              },
            ],
          },
        },
      };
    }
    case "SET_WIP_LIMIT": {
      const { boardId, columnId, limit } = action.payload;
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                wipLimits: { ...b.wipLimits, [columnId]: limit },
              },
        ),
      };
    }
    case "BULK_MOVE": {
      const { taskIds, toColumnId, boardId } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      const toTitle =
        board?.columns.find((c) => c.id === toColumnId)?.title ?? toColumnId;
      const updated = { ...state.tasks };
      taskIds.forEach((id) => {
        if (!updated[id]) return;
        updated[id] = {
          ...updated[id],
          updatedAt: now(),
          columnMovedAt: now(),
          activity: [
            ...updated[id].activity,
            {
              id: uid(),
              action: "moved",
              detail: `Bulk moved to "${toTitle}"`,
              timestamp: now(),
              user: "You",
            },
          ],
        };
      });
      return {
        ...state,
        tasks: updated,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.map((c) => ({
                  ...c,
                  taskIds:
                    c.id === toColumnId
                      ? [
                          ...c.taskIds.filter((id) => !taskIds.includes(id)),
                          ...taskIds,
                        ]
                      : c.taskIds.filter((id) => !taskIds.includes(id)),
                })),
              },
        ),
      };
    }
    case "BULK_DELETE": {
      const { taskIds, boardId } = action.payload;
      const remaining = { ...state.tasks };
      taskIds.forEach((id) => delete remaining[id]);
      return {
        ...state,
        tasks: remaining,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.map((c) => ({
                  ...c,
                  taskIds: c.taskIds.filter((id) => !taskIds.includes(id)),
                })),
              },
        ),
      };
    }
    case "BULK_ASSIGN": {
      const { taskIds, assignee } = action.payload;
      const updated = { ...state.tasks };
      taskIds.forEach((id) => {
        if (!updated[id]) return;
        updated[id] = {
          ...updated[id],
          assignee,
          updatedAt: now(),
          activity: [
            ...updated[id].activity,
            {
              id: uid(),
              action: "assigned",
              detail: `Assigned to ${assignee}`,
              timestamp: now(),
              user: "You",
            },
          ],
        };
      });
      return { ...state, tasks: updated };
    }
    case "TOGGLE_STAR": {
      const { taskId } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            starred: !task.starred,
            updatedAt: now(),
            activity: [
              ...task.activity,
              {
                id: uid(),
                action: "starred",
                detail: task.starred ? "Removed star" : "Starred task",
                timestamp: now(),
                user: "You",
              },
            ],
          },
        },
      };
    }
    case "DUPLICATE_TASK": {
      const { taskId, boardId } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      const newId = `task-${uid()}`;
      const newTask: Task = {
        ...task,
        id: newId,
        title: `${task.title} (copy)`,
        starred: false,
        comments: [],
        activity: [
          {
            id: uid(),
            action: "created",
            detail: `Duplicated from "${task.title}"`,
            timestamp: now(),
            user: "You",
          },
        ],
        columnMovedAt: now(),
        createdAt: now(),
        updatedAt: now(),
      };
      const board = state.boards.find((b) => b.id === boardId);
      const col = board?.columns.find((c) => c.taskIds.includes(taskId));
      if (!col) return state;
      return {
        ...state,
        tasks: { ...state.tasks, [newId]: newTask },
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                columns: b.columns.map((c) =>
                  c.id !== col.id
                    ? c
                    : { ...c, taskIds: [...c.taskIds, newId] },
                ),
              },
        ),
      };
    }
    case "ARCHIVE_TASKS": {
      const { boardId, columnId } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      const col = board?.columns.find((c) => c.id === columnId);
      if (!col) return state;
      const archiveIds = col.taskIds;
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id !== boardId
            ? b
            : {
                ...b,
                archivedTaskIds: [...b.archivedTaskIds, ...archiveIds],
                columns: b.columns.map((c) =>
                  c.id !== columnId ? c : { ...c, taskIds: [] },
                ),
              },
        ),
      };
    }
    case "RESTORE":
      return action.payload;
    default:
      return state;
  }
}

interface KanbanContextValue {
  state: KanbanState;
  dispatch: (action: KanbanAction) => void;
  undo: () => void;
  canUndo: boolean;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);

function loadState(): KanbanState {
  try {
    const saved = localStorage.getItem("kanban-state");
    if (saved) {
      const parsed = JSON.parse(saved);
      const tasks: Record<string, Task> = {};
      for (const [id, t] of Object.entries(parsed.tasks || {})) {
        tasks[id] = migrateTask(t);
      }
      return {
        boards: (parsed.boards || []).map(migrateBoard),
        tasks,
      };
    }
  } catch {
    /* ignore */
  }
  return createSeedData();
}

export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(kanbanReducer, null, loadState);
  const historyRef = useRef<KanbanState[]>([]);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    localStorage.setItem("kanban-state", JSON.stringify(state));
  }, [state]);

  const wrappedDispatch = useCallback((action: KanbanAction) => {
    if (action.type === "RESTORE") {
      dispatch(action);
      return;
    }
    historyRef.current = [...historyRef.current.slice(-19), stateRef.current];
    dispatch(action);
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) dispatch({ type: "RESTORE", payload: prev });
  }, []);

  return (
    <KanbanContext.Provider
      value={{
        state,
        dispatch: wrappedDispatch,
        undo,
        canUndo: historyRef.current.length > 0,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
};

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error("useKanban must be used within KanbanProvider");
  return ctx;
}

export function useBoard(boardId: string) {
  const { state } = useKanban();
  return state.boards.find((b) => b.id === boardId);
}

export function useBoardTasks(boardId: string) {
  const { state } = useKanban();
  return Object.values(state.tasks).filter((t) => t.boardId === boardId);
}

export function getTaskColumn(
  state: KanbanState,
  taskId: string,
  boardId: string,
) {
  const board = state.boards.find((b) => b.id === boardId);
  if (!board) return null;
  for (const col of board.columns) {
    if (col.taskIds.includes(taskId)) return col;
  }
  return null;
}
