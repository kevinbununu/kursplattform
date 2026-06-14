// src/app/(dashboard)/courses/[courseId]/learn/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { canAccessCourse } from "@/lib/stripe";
import { CoursePlayer } from "@/components/course/course-player";

type Params = { params: { courseId: string }; searchParams: { lessonId?: string } };

export default async function LearnPage({ params, searchParams }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

const course = await prisma.course.findUnique({
    where: { id: params.courseId, published: true },
    include: {
      creator: { select: { name: true, image: true } },
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            include: {
              progress: { where: { userId: session.user.id } },
            },
          },
        },
      },
      enrollments: { where: { userId: session.user.id } },
    },
  });

  if (!course) notFound();

  // Check enrollment
  const isEnrolled = course.enrollments.length > 0;
  if (!isEnrolled) {
    if (!canAccessCourse(session.user.subscriptionTier, course.accessTier)) {
      redirect(`/courses/${params.courseId}`);
    }
    // Auto-enroll
    await prisma.enrollment.create({
      data: { userId: session.user.id, courseId: params.courseId },
    });
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const activeLessonId = searchParams.lessonId ?? allLessons[0]?.id;
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0];

  // Sicherheitsabfrage: Wenn der Kurs noch keine Lektionen hat
  if (!activeLesson) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="font-semibold text-gray-900 text-xl mb-2">Dieser Kurs wird gerade aufgebaut</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Hier gibt es aktuell noch keine Lektionen zu sehen. Schau bald wieder vorbei oder füge im Creator Studio erste Inhalte hinzu!
          </p>
        </div>
      </div>
    );
  }
  return (
    <CoursePlayer
      course={course as any}
      activeLesson={activeLesson as any}
    />
  );
}
