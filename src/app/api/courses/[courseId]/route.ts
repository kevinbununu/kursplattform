// src/app/api/courses/[courseId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

type Params = { params: { courseId: string } };

// GET /api/courses/[courseId]
export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            include: {
              // 🆕 Keine selektiven Felder, sondern wir sagen Prisma einfach,
              // dass es den User-Fortschritt direkt mit-inkludieren soll!
              progress: session?.user?.id
                ? { where: { userId: session.user.id } }
                : false,
            },
          },
        },
      },
      enrollments: session?.user?.id
        ? { where: { userId: session.user.id } }
        : false,
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  if (!course.published && course.creatorId !== session?.user?.id && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Kurs nicht verfügbar" }, { status: 403 });
  }

  return NextResponse.json(course);
}
// PATCH /api/courses/[courseId]
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  if (course.creatorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.course.update({
    where: { id: params.courseId },
    data: {
      title: body.title,
      description: body.description,
      accessTier: body.accessTier,
      level: body.level,
      price: body.price,
      thumbnail: body.thumbnail,
      published: body.published,
    },
  });

  // 🆕 Cache auch hier für die Schülerseite killen, damit die Veröffentlichung sofort live geht:
  const { revalidatePath } = require("next/cache");
  revalidatePath(`/courses/${params.courseId}/learn`);

  return NextResponse.json(updated);
}

// DELETE /api/courses/[courseId]
export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  if (course.creatorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  await prisma.course.delete({ where: { id: params.courseId } });
  return new NextResponse(null, { status: 204 });
}
