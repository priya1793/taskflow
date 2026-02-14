import { useState, useCallback } from "react";

const STORAGE_KEY = "recently-viewed-tasks";
const MAX_ITEMS = 5;

export function useRecentlyViewed() {
  const [items, setItems] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const addRecentlyViewed = useCallback((taskId: string) => {
    setItems((prev) => {
      const next = [taskId, ...prev.filter((id) => id !== taskId)].slice(
        0,
        MAX_ITEMS,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentlyViewed: items, addRecentlyViewed };
}
