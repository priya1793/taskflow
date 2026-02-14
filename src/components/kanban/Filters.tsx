import React from "react";
import type { FilterState, Priority } from "@/types/kanban";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  assignees: string[];
  labels: string[];
}

const Filters: React.FC<FiltersProps> = ({
  filters,
  onChange,
  assignees,
  labels,
}) => {
  const set = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 sm:flex-none">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          data-search
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search tasks..."
          className="pl-8 h-8 w-full sm:w-48 bg-secondary/50 text-sm"
        />
      </div>
      <Filter className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
      <Select
        value={filters.priority}
        onValueChange={(v) => set({ priority: v as Priority | "all" })}
      >
        <SelectTrigger className="h-8 w-20 sm:w-28 bg-secondary/50 text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="P1">P1</SelectItem>
          <SelectItem value="P2">P2</SelectItem>
          <SelectItem value="P3">P3</SelectItem>
        </SelectContent>
      </Select>
      {assignees.length > 0 && (
        <Select
          value={filters.assignee || "all"}
          onValueChange={(v) => set({ assignee: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-8 w-24 sm:w-28 bg-secondary/50 text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {labels.length > 0 && (
        <Select
          value={filters.label || "all"}
          onValueChange={(v) => set({ label: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-8 w-24 sm:w-28 bg-secondary/50 text-xs hidden sm:flex">
            <SelectValue placeholder="Label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {labels.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default Filters;
