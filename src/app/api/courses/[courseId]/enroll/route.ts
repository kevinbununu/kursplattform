// src/app/api/courses/[courseId]/enroll/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/stripe";

type Params = { params: { courseId: string } };

// POST /api/courses/[courseId]/enroll — free enrollment
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course || !course.published) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  // Check subscription access
  if (!canAccessCourse(session.user.subscriptionTier, course.accessTier)) {
    return NextResponse.json(
      { error: "Dein Abo-Plan erlaubt keinen Zugriff auf diesen Kurs." },
      { status: 403 }
    );
  }

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: params.courseId } },
  });

  if (existing) {
    return NextResponse.json({ message: "Bereits eingeschrieben" });
  }

  const enrollment = await prisma.enrollment.create({
    data: { userId: session.user.id, courseId: params.courseId },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
