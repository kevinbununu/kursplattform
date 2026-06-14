"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Mathe");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category }),
      });

      if (response.ok) {
        // Keine Router-Experimente: Wir laden die Seite einfach hart neu!
        window.location.href = "/creator/courses";
      } else {
        alert("Fehler beim Speichern des Kurses.");
      }
    } catch (error) {
      console.error(error);
      alert("Etwas ist schiefgelaufen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl border border-gray-200 mt-10 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Neuen Kurs erstellen</h1>
      <p className="text-gray-500 text-sm mb-6">
        Gib deinem Kurs einen Namen und wähle einen Fachbereich aus.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kurs-Titel
          </label>
          <input
            type="text"
            required
            disabled={isLoading}
            placeholder="z.B. Mathe Grundlagen, Business Englisch..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategorie / Fachbereich
          </label>
          <select
            disabled={isLoading}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:opacity-50"
          >
            <option value="Mathe">Mathe</option>
            <option value="Englisch">Englisch</option>
            <option value="Web-Engineering">Web-Engineering</option>
            <option value="Chemie">Chemie</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/creator/courses"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {isLoading ? "Wird gespeichert..." : "Kurs anlegen"}
          </button>
        </div>
      </form>
    </div>
  );
}