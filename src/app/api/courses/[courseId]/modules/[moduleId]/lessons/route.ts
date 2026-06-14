import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache"; // ⚠️ Korrigiert: "next/cache" mit Schrägstrich!

type Params = { params: { courseId: string; moduleId: string } };

// POST /api/courses/[courseId]/modules/[moduleId]/lessons
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course || (course.creatorId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await req.json();

  const lastLesson = await prisma.lesson.findFirst({
    where: { moduleId: params.moduleId },
    orderBy: { position: "desc" },
  });

  const lesson = await prisma.lesson.create({
    data: {
      title: body.title,
      content: body.content,
      videoUrl: body.videoUrl,
      imageUrl: body.imageUrl, // 🆕 Bild wird beim Erstellen mitgespeichert
      duration: body.duration,
      isFree: body.isFree ?? false,
      position: (lastLesson?.position ?? 0) + 1,
      moduleId: params.moduleId,
    },
  });

  // 🆕 Cache für die Schüler-Ansicht dieses Kurses sofort löschen:
  revalidatePath(`/courses/${params.courseId}/learn`);

  return NextResponse.json(lesson, { status: 201 });
}