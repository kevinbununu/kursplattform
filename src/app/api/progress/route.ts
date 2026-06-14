// src/app/api/progress/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const progressSchema = z.object({
  lessonId: z.string(),
  completed: z.boolean(),
  watchedSeconds: z.number().optional(),
});

// POST /api/progress — upsert lesson progress
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lessonId, completed, watchedSeconds } = progressSchema.parse(body);

    // Verify the lesson exists and user is enrolled in the course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lektion nicht gefunden" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Nicht im Kurs eingeschrieben" }, { status: 403 });
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: session.user.id, lessonId },
      },
      update: {
        completed,
        watchedSeconds,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId: session.user.id,
        lessonId,
        completed,
        watchedSeconds,
        completedAt: completed ? new Date() : null,
      },
    });

    // Check if course is fully completed
    const courseId = lesson.module.courseId;
    const allLessons = await prisma.lesson.count({
      where: { module: { courseId } },
    });
    const completedLessons = await prisma.lessonProgress.count({
      where: { userId: session.user.id, completed: true, lesson: { module: { courseId } } },
    });

    if (allLessons === completedLessons) {
      await prisma.enrollment.update({
        where: { userId_courseId: { userId: session.user.id, courseId } },
        data: { completedAt: new Date() },
      });
    }

    return NextResponse.json({ progress, totalLessons: allLessons, completedLessons });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[POST /api/progress]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// GET /api/progress?courseId=... — get all progress for a course
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId erforderlich" }, { status: 400 });
  }

  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lesson: { module: { courseId } },
    },
  });

  const total = await prisma.lesson.count({ where: { module: { courseId } } });
  const completed = progress.filter((p) => p.completed).length;

  return NextResponse.json({ progress, total, completed, percentage: total ? Math.round((completed / total) * 100) : 0 });
}
