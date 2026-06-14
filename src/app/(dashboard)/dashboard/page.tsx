import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  // 🔮 SIMULATION: Prüfen, ob ?success=true in der URL übergeben wurde
  const resolvedParams = await searchParams;
  const isSuccess = resolvedParams.success === "true";

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          creator: { select: { name: true } },
          modules: { include: { lessons: true } },
          _count: { select: { modules: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });

  const progressData = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, completed: true },
  });

  const totalLessons = enrollments.reduce(
    (sum, e) => sum + e.course.modules.reduce((s, m) => s + m.lessons.length, 0),
    0
  );

  const stats = [
    { label: "Eingeschriebene Kurse", value: enrollments.length, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Abgeschlossene Lektionen", value: progressData.length, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Gesamte Lektionen", value: totalLessons, icon: Clock, color: "text-purple-600 bg-purple-50" },
    {
      label: "Gesamtfortschritt",
      value: totalLessons > 0 ? `${Math.round((progressData.length / totalLessons) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div>
      {/* 🟢 SIMULIERTER ERFOLGSBANNER */}
      {isSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-medium shadow-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Zahlung erfolgreich simuliert!</p>
            <p className="text-sm text-green-700 mt-0.5">Vielen Dank für deinen Einkauf. Dein Premium-Zugang wurde live in der Datenbank freigeschaltet.</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hallo, {session.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Hier ist dein Lernfortschritt auf einen Blick.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Zuletzt belegt</h2>
          <Link href="/courses" className="text-sm text-blue-600 hover:underline">Alle Kurse</Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Du hast noch keine Kurse belegt.</p>
            <Link href="/courses" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Jetzt Kurse entdecken →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map(({ course, enrolledAt, completedAt }) => {
              const totalL = course.modules.reduce((s, m) => s + m.lessons.length, 0);
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}/learn`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {totalL} Lektionen · von {course.creator.name}
                    </p>
                  </div>
                  {completedAt && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">
                      Abgeschlossen
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}