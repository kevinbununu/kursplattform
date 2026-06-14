// src/app/(dashboard)/creator/analytics/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, TrendingUp, BookOpen, Award } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") redirect("/dashboard");

  const courses = await prisma.course.findMany({
    where: { creatorId: session.user.id },
    include: {
      enrollments: { include: { user: { select: { name: true, email: true } } } },
      modules: {
        include: {
          lessons: {
            include: { progress: true },
          },
        },
      },
    },
  });

  const analytics = courses.map((course) => {
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    const enrollmentCount = course.enrollments.length;

    let totalPercentage = 0;
    for (const enrollment of course.enrollments) {
      const userDone = allLessons
        .flatMap((l) => l.progress)
        .filter((p) => p.userId === enrollment.userId && p.completed).length;
      totalPercentage += totalLessons > 0 ? (userDone / totalLessons) * 100 : 0;
    }

    const avgProgress = enrollmentCount > 0 ? Math.round(totalPercentage / enrollmentCount) : 0;
    const completed = course.enrollments.filter((e) => e.completedAt).length;

    return {
      id: course.id,
      title: course.title,
      published: course.published,
      accessTier: course.accessTier,
      enrollmentCount,
      avgProgress,
      completionRate: enrollmentCount > 0 ? Math.round((completed / enrollmentCount) * 100) : 0,
    };
  });

  const totalEnrollments = analytics.reduce((s, a) => s + a.enrollmentCount, 0);
  const publishedCourses = courses.filter((c) => c.published).length;
  const avgCompletion = analytics.length
    ? Math.round(analytics.reduce((s, a) => s + a.completionRate, 0) / analytics.length)
    : 0;

  const summary = [
    { label: "Kurse (veröffentlicht)", value: `${publishedCourses}/${courses.length}`, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Gesamte Teilnehmer", value: totalEnrollments, icon: Users, color: "text-green-600 bg-green-50" },
    { label: "Ø Abschlussrate", value: `${avgCompletion}%`, icon: Award, color: "text-orange-600 bg-orange-50" },
    { label: "Ø Fortschritt", value: `${analytics.length ? Math.round(analytics.reduce((s, a) => s + a.avgProgress, 0) / analytics.length) : 0}%`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
  ];

  const TIER_LABELS: Record<string, string> = { FREE: "Kostenlos", BRONZE: "Bronze", SILVER: "Silber", GOLD: "Gold" };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Einblicke in deine Kurse und Teilnehmer</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summary.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Course breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Kursübersicht</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Kurs", "Stufe", "Teilnehmer", "Ø Fortschritt", "Abschlussrate"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {analytics.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900 text-sm">{a.title}</p>
                  {!a.published && (
                    <span className="text-xs text-gray-400">Entwurf</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{TIER_LABELS[a.accessTier]}</td>
                <td className="px-5 py-4 text-sm text-gray-900 font-medium">{a.enrollmentCount}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${a.avgProgress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{a.avgProgress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${a.completionRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{a.completionRate}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {analytics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                  Noch keine Kursdaten vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
