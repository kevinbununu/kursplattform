// src/hooks/use-course-progress.ts
"use client";

import { useState, useCallback } from "react";

export function useCourseProgress(initialCompleted: Set<string> = new Set()) {
  const [completed, setCompleted] = useState<Set<string>>(initialCompleted);
  const [pending, setPending] = useState<string | null>(null);

  const markLesson = useCallback(async (lessonId: string, done: boolean) => {
    setPending(lessonId);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: done }),
      });
      if (res.ok) {
        setCompleted((prev) => {
          const next = new Set(prev);
          done ? next.add(lessonId) : next.delete(lessonId);
          return next;
        });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setPending(null);
    }
  }, []);

  return { completed, markLesson, pending };
}
