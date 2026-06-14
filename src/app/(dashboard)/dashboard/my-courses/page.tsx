// src/app/(dashboard)/dashboard/my-courses/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle } from "lucide-react";

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          creator: { select: { name: true } },
          modules: {
            include: { lessons: { include: { progress: { where: { userId: session.user.id } } } } },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meine Kurse</h1>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Du hast dich noch für keinen Kurs eingeschrieben.</p>
          <Link
            href="/courses"
            className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Kurse entdecken
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments.map(({ course, enrolledAt, completedAt }) => {
            const allLessons = course.modules.flatMap((m) => m.lessons);
            const totalLessons = allLessons.length;
            const completedLessons = allLessons.filter(
              (l) => l.progress?.[0]?.completed
            ).length;
            const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}/learn`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-blue-300" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">von {course.creator.name}</p>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>{completedLessons}/{totalLessons} Lektionen</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {completedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-3">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Abgeschlossen am {new Date(completedAt).toLocaleDateString("de-DE")}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
