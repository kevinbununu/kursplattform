// src/components/course/course-builder.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, ChevronDown, ChevronRight, GripVertical, Save, Eye } from "lucide-react";

interface Lesson {
  id?: string;
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  isFree: boolean;
}

interface Module {
  id?: string;
  title: string;
  lessons: Lesson[];
}

interface CourseData {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  accessTier: string;
  level: string;
  published: boolean;
  modules: Module[];
}

interface Props {
  course: CourseData | null;
}

export function CourseBuilder({ course }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));

  const [data, setData] = useState<CourseData>({
    title: course?.title ?? "",
    description: course?.description ?? "",
    thumbnail: (course as any)?.thumbnail ?? "",
    accessTier: course?.accessTier ?? "FREE",
    level: course?.level ?? "BEGINNER",
    published: course?.published ?? false,
    modules: course?.modules ?? [],
  });

  const toggleModule = (i: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const addModule = () => {
    setData((d) => ({
      ...d,
      modules: [...d.modules, { title: "Neues Modul", lessons: [] }],
    }));
    setExpandedModules((prev) => new Set(prev).add(data.modules.length));
  };

  const updateModule = (i: number, title: string) => {
    setData((d) => {
      const modules = [...d.modules];
      modules[i] = { ...modules[i], title };
      return { ...d, modules };
    });
  };

  const removeModule = (i: number) => {
    setData((d) => ({ ...d, modules: d.modules.filter((_, idx) => idx !== i) }));
  };

  const addLesson = (moduleIdx: number) => {
    setData((d) => {
      const modules = [...d.modules];
      modules[moduleIdx] = {
        ...modules[moduleIdx],
        lessons: [
          ...modules[moduleIdx].lessons,
          { title: "Neue Lektion", content: "", videoUrl: "", imageUrl: "", isFree: false },
        ],
      };
      return { ...d, modules };
    });
  };

  const updateLesson = (mi: number, li: number, updates: Partial<Lesson>) => {
    setData((d) => {
      const modules = [...d.modules];
      const lessons = [...modules[mi].lessons];
      lessons[li] = { ...lessons[li], ...updates };
      modules[mi] = { ...modules[mi], lessons };
      return { ...d, modules };
    });
  };

const removeLesson = async (mi: number, li: number) => {
    const lesson = data.modules[mi].lessons[li];
    
    // 🆕 Wenn die Lektion eine ID hat, direkt aus der Datenbank löschen:
    if (lesson.id && course?.id) {
      try {
        const moduleId = data.modules[mi].id;
        await fetch(`/api/courses/${course.id}/modules/${moduleId}/lessons/${lesson.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Fehler beim Löschen in der DB:", err);
      }
    }

    // Danach aus dem Zustand auf dem Bildschirm entfernen
    setData((d) => {
      const modules = [...d.modules];
      modules[mi] = {
        ...modules[mi],
        lessons: modules[mi].lessons.filter((_, idx) => idx !== li),
      };
      return { ...d, modules };
    });
  };

const handleSave = async (publish?: boolean) => {
    setSaving(true);
    try {
      const payload = { ...data, published: publish ?? data.published };

      // 1. Kurs erstellen oder updaten
      const res = await fetch(
        course?.id ? `/api/courses/${course.id}` : "/api/courses",
        {
          method: course?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      const saved = await res.json();
      const courseId = saved.id;

      // 2. Module und Lektionen sauber abgleichen
      for (let mi = 0; mi < data.modules.length; mi++) {
        const mod = data.modules[mi];
        let currentModuleId = mod.id;

        // Wenn das Modul neu ist (keine ID hat), erstellen wir es auf dem Server
        if (!currentModuleId) {
          const mr = await fetch(`/api/courses/${courseId}/modules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: mod.title, description: "" }),
          });
          
          if (!mr.ok) throw new Error("Modul-Erstellung fehlgeschlagen");
          const savedMod = await mr.json();
          currentModuleId = savedMod.id; // 🔥 WICHTIG: Die echte, neue ID vom Server zuweisen!
        }

        // Jetzt die Lektionen dieses Moduls speichern – mit der garantierten ID!
        for (const lesson of mod.lessons) {
          if (!lesson.id) {
            // Neue Lektion -> POST (Jetzt mit der korrekten currentModuleId!)
            await fetch(`/api/courses/${courseId}/modules/${currentModuleId}/lessons`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(lesson),
            });
          } else {
            // Existierende Lektion updaten -> PATCH
            await fetch(`/api/courses/${courseId}/modules/${currentModuleId}/lessons/${lesson.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(lesson),
            });
          }
        }
      }

      router.push("/creator");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Main content */}
      <div className="col-span-2 space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Kursdetails</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel *</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Python für Anfänger"
              />
            </div>
           <div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Beschreibung
  </label>
  <textarea
    value={data.description}
    onChange={(e) => setData({ ...data, description: e.target.value })}
    rows={4}
    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    placeholder="Was lernen die Teilnehmer in diesem Kurs?"
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Thumbnail URL
  </label>
  <input
    type="url"
    value={data.thumbnail}
    onChange={(e) => setData({ ...data, thumbnail: e.target.value })}
    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="https://beispiel.de/bild.jpg"
  />
</div>
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Kursstruktur</h2>
            <button
              onClick={addModule}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <PlusCircle className="w-4 h-4" /> Modul hinzufügen
            </button>
          </div>

          {data.modules.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center">
              <p className="text-gray-400 text-sm">
                Noch keine Module. Füge dein erstes Modul hinzu.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {data.modules.map((mod, mi) => (
              <div key={mi} className="border border-gray-100 rounded-lg overflow-hidden">
                {/* Module Header */}
                <div className="flex items-center gap-3 p-4 bg-gray-50">
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <button
                    onClick={() => toggleModule(mi)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedModules.has(mi) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => updateModule(mi, e.target.value)}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">{mod.lessons.length} Lektionen</span>
                  <button
                    onClick={() => removeModule(mi)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Lessons */}
                {expandedModules.has(mi) && (
                  <div className="p-4 space-y-3">
                    {mod.lessons.map((lesson, li) => (
                      <div key={li} className="border border-gray-100 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-200" />
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                            className="flex-1 text-sm font-medium focus:outline-none"
                            placeholder="Lektionstitel"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-gray-500">
                            <input
                              type="checkbox"
                              checked={lesson.isFree}
                              onChange={(e) => updateLesson(mi, li, { isFree: e.target.checked })}
                              className="rounded"
                            />
                            Kostenlose Vorschau
                          </label>
                          <button
                            onClick={() => removeLesson(mi, li)}
                            className="text-gray-200 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={lesson.content}
                          onChange={(e) => updateLesson(mi, li, { content: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                          placeholder="Inhalt / Beschreibung der Lektion..."
                        />
                        <input
                          type="url"
                          value={lesson.videoUrl}
                          onChange={(e) => updateLesson(mi, li, { videoUrl: e.target.value })}
                          className="w-full border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="Video-URL (YouTube, Vimeo, etc.)"
                        />
                        <input
                          type="url"
                          value={lesson.imageUrl || ""}
                          onChange={(e) => updateLesson(mi, li, { imageUrl: e.target.value })}
                          className="w-full border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 mt-2"
                          placeholder="Bild-URL (z.B. von Unsplash oder eine Web-Adresse)"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addLesson(mi)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Lektion hinzufügen
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar / Settings */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-8">
          <h2 className="font-semibold text-gray-900 mb-4">Veröffentlichung</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Zugriffs-Stufe</label>
              <select
                value={data.accessTier}
                onChange={(e) => setData({ ...data, accessTier: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FREE">Kostenlos</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silber</option>
                <option value="GOLD">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Schwierigkeitsgrad</label>
              <select
                value={data.level}
                onChange={(e) => setData({ ...data, level: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BEGINNER">Anfänger</option>
                <option value="INTERMEDIATE">Fortgeschritten</option>
                <option value="ADVANCED">Experte</option>
              </select>
            </div>

            <div className="pt-4 space-y-3 border-t border-gray-100">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Als Entwurf speichern
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4" /> {saving ? "Wird gespeichert..." : "Veröffentlichen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
