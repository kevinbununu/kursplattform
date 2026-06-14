// src/app/(dashboard)/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminUserTable } from "@/components/dashboard/admin-user-table";
import { Users, BookOpen, BarChart2, CreditCard } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const [userCount, courseCount, enrollmentCount] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.enrollment.count(),
  ]);

  const tierCounts = await prisma.subscription.groupBy({
    by: ["tier"],
    _count: true,
  });

  const users = await prisma.user.findMany({
    include: {
      subscription: true,
      _count: { select: { enrollments: true, courses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const summary = [
    { label: "Nutzer gesamt", value: userCount, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Kurse (aktiv)", value: courseCount, icon: BookOpen, color: "text-green-600 bg-green-50" },
    { label: "Einschreibungen", value: enrollmentCount, icon: BarChart2, color: "text-purple-600 bg-purple-50" },
    {
      label: "Bezahlende Nutzer",
      value: tierCounts.filter((t) => t.tier !== "FREE").reduce((s, t) => s + t._count, 0),
      icon: CreditCard,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin-Panel</h1>
        <p className="text-gray-500 mt-1">Plattformübersicht und Nutzerverwaltung</p>
      </div>

      {/* Summary */}
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

      {/* Tier distribution */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Abo-Verteilung</h2>
        <div className="grid grid-cols-4 gap-4">
          {["FREE", "BRONZE", "SILVER", "GOLD"].map((tier) => {
            const count = tierCounts.find((t) => t.tier === tier)?._count ?? 0;
            const pct = userCount > 0 ? Math.round((count / userCount) * 100) : 0;
            const colors: Record<string, string> = {
              FREE: "bg-gray-500",
              BRONZE: "bg-orange-500",
              SILVER: "bg-slate-400",
              GOLD: "bg-yellow-400",
            };
            const labels: Record<string, string> = {
              FREE: "Free", BRONZE: "Bronze", SILVER: "Silber", GOLD: "Gold",
            };
            return (
              <div key={tier} className="text-center">
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 mb-2">{labels[tier]}</div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`${colors[tier]} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-gray-400 mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Nutzer</h2>
        </div>
        <AdminUserTable users={users as any} />
      </div>
    </div>
  );
}
