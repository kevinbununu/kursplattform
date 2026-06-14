// src/app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/analytics — creator analytics
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const creatorId = session.user.id;

  const courses = await prisma.course.findMany({
    where: { creatorId },
    include: {
      enrollments: true,
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

    // Avg progress per enrolled user
    let totalPercentage = 0;
    for (const enrollment of course.enrollments) {
      const userProgress = allLessons
        .flatMap((l) => l.progress)
        .filter((p) => p.userId === enrollment.userId && p.completed).length;
      totalPercentage += totalLessons > 0 ? (userProgress / totalLessons) * 100 : 0;
    }

    const avgProgress = enrollmentCount > 0 ? totalPercentage / enrollmentCount : 0;
    const completedEnrollments = course.enrollments.filter((e) => e.completedAt).length;
    const completionRate = enrollmentCount > 0 ? (completedEnrollments / enrollmentCount) * 100 : 0;

    return {
      courseId: course.id,
      courseTitle: course.title,
      published: course.published,
      totalEnrollments: enrollmentCount,
      avgProgress: Math.round(avgProgress),
      completionRate: Math.round(completionRate),
    };
  });

  const totalRevenue = 0; // Would calculate from Stripe in production

  return NextResponse.json({
    analytics,
    summary: {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.published).length,
      totalEnrollments: analytics.reduce((s, a) => s + a.totalEnrollments, 0),
      totalRevenue,
    },
  });
}
