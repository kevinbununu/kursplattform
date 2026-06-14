// src/app/api/courses/[courseId]/modules/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { courseId: string } };

// POST /api/courses/[courseId]/modules
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });

  if (course.creatorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const body = await req.json();

  // Get the next position
  const lastModule = await prisma.module.findFirst({
    where: { courseId: params.courseId },
    orderBy: { position: "desc" },
  });

  const module = await prisma.module.create({
    data: {
      title: body.title,
      description: body.description,
      position: (lastModule?.position ?? 0) + 1,
      courseId: params.courseId,
    },
  });

  return NextResponse.json(module, { status: 201 });
}
