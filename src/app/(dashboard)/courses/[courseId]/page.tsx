// src/app/(dashboard)/courses/[courseId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { canAccessCourse, PLANS } from "@/lib/stripe";
import {
  BookOpen, Users, BarChart, Lock, PlayCircle, FileText, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Params = { params: { courseId: string } };

const TIER_LABELS: Record<string, string> = {
  FREE: "Kostenlos", BRONZE: "Bronze", SILVER: "Silber", GOLD: "Gold",
};
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Anfänger", INTERMEDIATE: "Fortgeschritten", ADVANCED: "Experte",
};

export default async function CourseDetailPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  const userTier = session?.user?.subscriptionTier ?? "FREE";

  const course = await prisma.course.findUnique({
    where: { id: params.courseId, published: true },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: { orderBy: { position: "asc" } },
        },
      },
      _count: { select: { enrollments: true } },
      enrollments: session?.user ? { where: { userId: session.user.id } } : false,
    },
  });

  if (!course) notFound();

  const hasAccess = canAccessCourse(userTier as any, course.accessTier);
  const isEnrolled = (course.enrollments as any[])?.length > 0;
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const requiredPlan = PLANS.find((p) => p.tier === course.accessTier);

  // Falls der Kurs noch gar keine Lektionen hat, zeigen wir diesen Hinweis:
  if (totalLessons === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4">
            📚
          </div>
          <h3 className="font-semibold text-gray-900 text-xl mb-2">Dieser Kurs wird gerade aufgebaut</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Hier gibt es aktuell noch keine Lektionen zu sehen. Schau bald wieder vorbei oder füge im Creator Studio erste Inhalte hinzu!
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            course.accessTier === "FREE" ? "bg-gray-100 text-gray-600" :
            course.accessTier === "BRONZE" ? "bg-orange-100 text-orange-700" :
            course.accessTier === "SILVER" ? "bg-slate-100 text-slate-700" :
            "bg-yellow-100 text-yellow-700"
          )}>
            {TIER_LABELS[course.accessTier]}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
            {LEVEL_LABELS[course.level]}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
        {course.description && (
          <p className="text-gray-600 leading-relaxed">{course.description}</p>
        )}
        <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {course._count.enrollments} Teilnehmer
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> {totalLessons} Lektionen
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart className="w-4 h-4" /> {LEVEL_LABELS[course.level]}
          </span>
          <span>von <span className="font-medium text-gray-700">{course.creator.name}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Curriculum */}
        <div className="col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kursinhalt</h2>
          <div className="space-y-3">
            {course.modules.map((mod) => (
              <div key={mod.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900 text-sm">{mod.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{mod.lessons.length} Lektionen</p>
                </div>
                <ul className="divide-y divide-gray-50">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                      {lesson.videoUrl ? (
                        <PlayCircle className="w-4 h-4 text-gray-300 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                      {lesson.isFree && (
                        <span className="text-xs text-green-600 font-medium">Vorschau</span>
                      )}
                      {!hasAccess && !lesson.isFree && (
                        <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 sticky top-8">
            <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center mb-5">
              <BookOpen className="w-10 h-10 text-blue-300" />
            </div>

            {hasAccess ? (
              <>
                <Link
                  href={`/courses/${course.id}/learn`}
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-3"
                >
                  {isEnrolled ? "Weiterlernen →" : "Jetzt starten →"}
                </Link>
                {isEnrolled && (
                  <p className="text-xs text-center text-green-600 flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Du bist bereits eingeschrieben
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    <Lock className="w-4 h-4 inline mr-1" />
                    {requiredPlan?.name}-Abo erforderlich
                  </p>
                  <p className="text-xs text-amber-700">
                    Ab €{requiredPlan?.priceMonthly}/Monat – inkl. Zugang zu allen{" "}
                    {TIER_LABELS[course.accessTier]}-Kursen.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upgrade – {requiredPlan?.name} →
                </Link>
              </>
            )}

            <ul className="mt-5 space-y-2">
              {[
                `${totalLessons} Lektionen`,
                `${course.modules.length} Module`,
                LEVEL_LABELS[course.level],
                "Fortschrittsanzeige",
                "Zertifikat nach Abschluss",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
