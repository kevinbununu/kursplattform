// src/app/(dashboard)/courses/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/stripe";
import Link from "next/link";
import { BookOpen, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionTier } from "@prisma/client";

const TIER_LABELS: Record<string, string> = {
  FREE: "Kostenlos",
  BRONZE: "Bronze",
  SILVER: "Silber",
  GOLD: "Gold",
};

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-600",
  BRONZE: "bg-orange-100 text-orange-700",
  SILVER: "bg-slate-100 text-slate-700",
  GOLD: "bg-yellow-100 text-yellow-700",
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Anfänger",
  INTERMEDIATE: "Fortgeschritten",
  ADVANCED: "Experte",
};

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  const userTier = (session?.user?.subscriptionTier ?? "FREE") as SubscriptionTier;

  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      creator: { select: { name: true } },
      _count: { select: { enrollments: true } },
      modules: { include: { _count: { select: { lessons: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const enrolledIds = session?.user
    ? (await prisma.enrollment.findMany({
        where: { userId: session.user.id },
        select: { courseId: true },
      })).map((e) => e.courseId)
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kursübersicht</h1>
        <p className="text-gray-500 mt-1">Entdecke Kurse passend zu deinem Abo-Plan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => {
          const hasAccess = canAccessCourse(userTier, course.accessTier);
          const isEnrolled = enrolledIds.includes(course.id);
          const totalLessons = course.modules.reduce(
            (s, m) => s + m._count.lessons,
            0
          );

          return (
            <div
              key={course.id}
              className={cn(
                "bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md",
                hasAccess ? "border-gray-100" : "border-gray-100 opacity-80"
              )}
            >
             {/* Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
          {course.thumbnail ? (
           <img
            src={course.thumbnail}
           alt={course.title}
           className="w-full h-full object-cover"
             />
             ) : (
               <BookOpen className="w-12 h-12 text-blue-300" />
              )}

          {!hasAccess && (
           <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
         <div className="text-center text-white">
                     <Lock className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs font-medium">{TIER_LABELS[course.accessTier]} erforderlich</p>
                    </div>
                  </div>
                )}
                </div>

              <div className="p-5">
                <div className="flex items-start gap-2 mb-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TIER_COLORS[course.accessTier])}>
                    {TIER_LABELS[course.accessTier]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {LEVEL_LABELS[course.level]}
                  </span>
                  {isEnrolled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      Eingeschrieben
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>

                {course.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>von {course.creator.name}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {course._count.enrollments}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mb-4">{totalLessons} Lektionen</p>

                {hasAccess ? (
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {isEnrolled ? "Weiterlernen" : "Kurs starten"}
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="block w-full text-center border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Upgrade erforderlich →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Noch keine Kurse verfügbar.</p>
        </div>
      )}
    </div>
  );
}
