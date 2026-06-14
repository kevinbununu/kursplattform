// src/components/course/course-player.tsx
"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, ChevronDown, ChevronRight, PlayCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  isFree: boolean;
  progress: { completed: boolean }[];
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
  creator: { name: string | null; image: string | null };
}

interface Props {
  course: Course;
  activeLesson: Lesson;
}

export function CoursePlayer({ course, activeLesson: initialLesson }: Props) {
  const router = useRouter();
  const [activeLesson, setActiveLesson] = useState(initialLesson);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const mod of course.modules) {
      if (mod.lessons.some((l) => l.id === initialLesson.id)) s.add(mod.id);
    }
    return s;
  });
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.progress?.[0]?.completed) s.add(lesson.id);
      }
    }
    return s;
  });
  const [marking, setMarking] = useState(false);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = completedLessons.size;
  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const selectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    router.push(`/courses/${course.id}/learn?lessonId=${lesson.id}`, { scroll: false });
  };

  const markComplete = async (completed: boolean) => {
    setMarking(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: activeLesson.id, completed }),
      });

      if (res.ok) {
        setCompletedLessons((prev) => {
          const next = new Set(prev);
          completed ? next.add(activeLesson.id) : next.delete(activeLesson.id);
          return next;
        });

        // Auto-navigate to next lesson
        if (completed) {
          const currentIdx = allLessons.findIndex((l) => l.id === activeLesson.id);
          const nextLesson = allLessons[currentIdx + 1];
          if (nextLesson) setTimeout(() => selectLesson(nextLesson), 500);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  const isCompleted = completedLessons.has(activeLesson.id);

  return (
    <div className="-m-8 flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col overflow-hidden shrink-0">
        {/* Course header */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {course.title}
          </h2>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{completedCount} / {totalLessons} Lektionen</span>
              <span className="font-medium text-gray-700">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modules & Lessons */}
        <nav className="flex-1 overflow-y-auto p-2">
          {course.modules.map((mod) => (
            <div key={mod.id} className="mb-1">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                {expandedModules.has(mod.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-700 truncate">{mod.title}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">
                  {mod.lessons.filter((l) => completedLessons.has(l.id)).length}/{mod.lessons.length}
                </span>
              </button>

              {expandedModules.has(mod.id) && (
                <div className="ml-4 space-y-0.5">
                  {mod.lessons.map((lesson) => {
                    const done = completedLessons.has(lesson.id);
                    const active = lesson.id === activeLesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                          active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
                        )}
                      >
                        {done ? (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : lesson.videoUrl ? (
                          <PlayCircle className={cn("w-4 h-4 shrink-0", active ? "text-blue-500" : "text-gray-300")} />
                        ) : (
                          <FileText className={cn("w-4 h-4 shrink-0", active ? "text-blue-500" : "text-gray-300")} />
                        )}
                        <span className="text-xs truncate">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Lesson header */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{activeLesson.title}</h1>
            <button
              onClick={() => markComplete(!isCompleted)}
              disabled={marking}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0",
                isCompleted
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Abgeschlossen
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" /> Als abgeschlossen markieren
                </>
              )}
            </button>
          </div>

          {/* Video */}
          {activeLesson.videoUrl && (
            <div className="aspect-video rounded-xl overflow-hidden bg-black mb-8 shadow-lg">
              {activeLesson.videoUrl.includes("youtube.com") || activeLesson.videoUrl.includes("youtu.be") ? (
                <iframe
                  src={activeLesson.videoUrl.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeLesson.videoUrl}
                  controls
                  className="w-full h-full"
                  onEnded={() => markComplete(true)}
                />
           )}
        </div>
      )}

      {/* Bild anzeigen, falls eine imageUrl vorhanden ist */}
      {activeLesson.imageUrl && (
        <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 mb-8 shadow-sm">
          <img 
            src={activeLesson.imageUrl} 
            alt="Lektions-Visualisierung" 
            className="w-full h-auto max-h-[480px] object-contain mx-auto"
          />
        </div>
      )}
          {/* Content */}
          {activeLesson.content && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 prose prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: activeLesson.content.replace(/\n/g, "<br />") }}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {(() => {
              const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
              const prev = allLessons[idx - 1];
              const next = allLessons[idx + 1];
              return (
                <>
                  <button
                    onClick={() => prev && selectLesson(prev)}
                    disabled={!prev}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Vorherige Lektion
                  </button>
                  <button
                    onClick={() => next && selectLesson(next)}
                    disabled={!next}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Nächste Lektion →
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
