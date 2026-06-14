// src/app/api/courses/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const createCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  accessTier: z.enum(["FREE", "BRONZE", "SILVER", "GOLD"]).default("FREE"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
});

// GET /api/courses — public list of published courses
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier");
  const level = searchParams.get("level");
  const search = searchParams.get("search");

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(tier ? { accessTier: tier as any } : {}),
      ...(level ? { level: level as any } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { enrollments: true, modules: true } },
      modules: {
        include: { _count: { select: { lessons: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}

// POST /api/courses — creator creates a course
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createCourseSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug: slugify(data.title),
        description: data.description,
        accessTier: data.accessTier,
        level: data.level,
        price: data.price,
        thumbnail: data.thumbnail,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[POST /api/courses]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
