import Link from "next/link";
import { PlusCircle, BookOpen } from "lucide-react";
import { PrismaClient } from "@prisma/client";

export default async function CreatorCoursesPage() {
  const prisma = new PrismaClient();
  
  // Holt deine echten Kurse live aus Supabase
  const courses = await prisma.course.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deine Kurse</h1>
          <p className="text-gray-500 mt-1">Hier siehst du alle von dir erstellten Kurse.</p>
        </div>
        <Link
          href="/creator/courses/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Neuer Kurs
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <PlusCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Noch keine Kurse vorhanden</h3>
          <p className="text-gray-500 text-sm mb-6">Erstelle jetzt deinen ersten Kurs!</p>
          <Link
            href="/creator/courses/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium"
          >
            <PlusCircle className="w-4 h-4" /> Kurs erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {course.category || "Allgemein"}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{course.title}</h3>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Module bearbeiten
                </span>
                <Link 
                  href={`/creator/courses/${course.id}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  Verwalten &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}