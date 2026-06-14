import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache"; // ⚠️ WICHTIG: "next/cache" mit Schrägstrich!

type Params = { params: { courseId: string; moduleId: string; lessonId: string } };

async function assertOwner(courseId: string, userId: string, role: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return false;
  return course.creatorId === userId || role === "ADMIN";
}

// GET /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]
export async function GET(req: Request, { params }: Params) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { media: true },
  });
  if (!lesson) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(lesson);
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  if (!(await assertOwner(params.courseId, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.lesson.update({
    where: { id: params.lessonId },
    data: {
      title: body.title,
      content: body.content,
      videoUrl: body.videoUrl,
      imageUrl: body.imageUrl, 
      duration: body.duration,
      isFree: body.isFree,
      position: body.position,
    },
  });

  // 🆕 Cache leeren, damit Änderungen am Bild/Inhalt SOFORT sichtbar sind
  revalidatePath(`/courses/${params.courseId}/learn`);

  return NextResponse.json(updated);
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]
export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  if (!(await assertOwner(params.courseId, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  await prisma.lesson.delete({ where: { id: params.lessonId } });

  // 🆕 Cache leeren, damit die gelöschte Lektion SOFORT aus der Sidebar verschwindet
  revalidatePath(`/courses/${params.courseId}/learn`);

  return new NextResponse(null, { status: 204 });
}