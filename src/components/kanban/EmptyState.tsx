import React from "react";
import { Inbox, SearchX } from "lucide-react";

interface EmptyStateProps {
  type: "no-tasks" | "no-results" | "no-boards";
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, message }) => {
  const config = {
    "no-tasks": {
      icon: Inbox,
      title: "Nothing here yet",
      desc: message || "Add your first task to get started.",
    },
    "no-results": {
      icon: SearchX,
      title: "No results found",
      desc: message || "Try adjusting your filters or search query.",
    },
    "no-boards": {
      icon: Inbox,
      title: "No boards yet",
      desc: message || "Create your first board to start organizing tasks.",
    },
  };

  const c = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <c.icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{c.title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">{c.desc}</p>
    </div>
  );
};

export default EmptyState;
