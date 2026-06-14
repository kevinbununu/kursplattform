// src/app/(dashboard)/creator/courses/[courseId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CourseBuilder } from "@/components/course/course-builder";

type Params = { params: { courseId: string } };

export default async function CourseEditorPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isNew = params.courseId === "new";

  if (isNew) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Neuen Kurs erstellen</h1>
        <CourseBuilder course={null} />
      </div>
    );
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: { lessons: { orderBy: { position: "asc" }, include: { media: true } } },
      },
    },
  });

  if (!course) notFound();
  if (course.creatorId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/creator");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Kurs bearbeiten</h1>
      <CourseBuilder course={course as any} />
    </div>
  );
}
