// src/types/index.ts
import { Course, Module, Lesson, LessonProgress, Enrollment, User, Subscription } from "@prisma/client";

export type CourseWithDetails = Course & {
  creator: Pick<User, "id" | "name" | "image">;
  modules: (Module & {
    lessons: Lesson[];
  })[];
  enrollments: Enrollment[];
  _count: { enrollments: number };
};

export type LessonWithProgress = Lesson & {
  progress: LessonProgress[];
};

export type ModuleWithLessons = Module & {
  lessons: LessonWithProgress[];
};

export type CourseProgress = {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
};

export type CreatorAnalytics = {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  avgProgress: number;
  completionRate: number;
};
