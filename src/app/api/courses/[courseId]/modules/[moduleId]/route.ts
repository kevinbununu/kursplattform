import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache"; // 🆕 Cache-Import hinzufügen!

type Params = { params: { courseId: string; moduleId: string } };

async function assertOwner(courseId: string, userId: string, role: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return false;
  return course.creatorId === userId || role === "ADMIN";
}

// PATCH /api/courses/[courseId]/modules/[moduleId]
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  if (!(await assertOwner(params.courseId, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.module.update({
    where: { id: params.moduleId },
    data: { title: body.title, description: body.description, position: body.position },
  });

  // 🆕 Auch beim Bearbeiten des Modul-Namens den Cache leeren:
  revalidatePath(`/courses/${params.courseId}/learn`);

  return NextResponse.json(updated);
}

// DELETE /api/courses/[courseId]/modules/[moduleId]
export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  if (!(await assertOwner(params.courseId, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  // 🆕 1. Zuerst alle Lektionen löschen, die zu diesem Modul gehören (Sicherheitsblockade lösen)
  await prisma.lesson.deleteMany({
    where: { moduleId: params.moduleId }
  });

  // 2. Jetzt das Modul selbst löschen
  await prisma.module.delete({ where: { id: params.moduleId } });

  // 🆕 3. Cache sofort leeren, damit das Modul augenblicklich überall verschwindet!
  revalidatePath(`/courses/${params.courseId}/learn`);

  return new NextResponse(null, { status: 204 });
}