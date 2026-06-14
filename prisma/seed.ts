// prisma/seed.ts
import { PrismaClient, Role, SubscriptionTier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin
  const adminHash = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@learnhub.de" },
    update: {},
    create: {
      email: "admin@learnhub.de",
      name: "Admin User",
      passwordHash: adminHash,
      role: Role.ADMIN,
      subscription: { create: { tier: SubscriptionTier.GOLD, status: "ACTIVE" } },
    },
  });

  // Creator
  const creatorHash = await bcrypt.hash("creator1234", 12);
  const creator = await prisma.user.upsert({
    where: { email: "creator@learnhub.de" },
    update: {},
    create: {
      email: "creator@learnhub.de",
      name: "Max Creator",
      passwordHash: creatorHash,
      role: Role.CREATOR,
      subscription: { create: { tier: SubscriptionTier.SILVER, status: "ACTIVE" } },
    },
  });

  // Student
  const userHash = await bcrypt.hash("user1234", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@learnhub.de" },
    update: {},
    create: {
      email: "student@learnhub.de",
      name: "Anna Student",
      passwordHash: userHash,
      role: Role.USER,
      subscription: { create: { tier: SubscriptionTier.BRONZE, status: "ACTIVE" } },
    },
  });

  // Demo course
  const course = await prisma.course.upsert({
    where: { slug: "python-grundlagen-demo" },
    update: {},
    create: {
      title: "Python Grundlagen",
      slug: "python-grundlagen-demo",
      description: "Lerne Python von Grund auf – von Variablen bis zu Funktionen.",
      accessTier: "FREE",
      level: "BEGINNER",
      published: true,
      creatorId: creator.id,
      modules: {
        create: [
          {
            title: "Einführung in Python",
            position: 1,
            lessons: {
              create: [
                { title: "Was ist Python?", content: "Python ist eine interpretierte, hochrangige Programmiersprache.", position: 1, isFree: true },
                { title: "Installation & Setup", content: "Lade Python von python.org herunter und installiere es.", position: 2, isFree: true },
                { title: "Erste Schritte: Hello World", content: "print('Hello, World!') – dein erstes Python-Programm.", position: 3 },
              ],
            },
          },
          {
            title: "Variablen & Datentypen",
            position: 2,
            lessons: {
              create: [
                { title: "Variablen definieren", content: "name = 'Python'\nversion = 3.11", position: 1 },
                { title: "Strings, Integers, Floats", content: "Die grundlegenden Datentypen in Python.", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // Enrollment for student
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: { userId: student.id, courseId: course.id },
  });

  console.log("✅ Seed abgeschlossen!");
  console.log("\n📧 Test-Accounts:");
  console.log("  Admin:   admin@learnhub.de / admin1234");
  console.log("  Creator: creator@learnhub.de / creator1234");
  console.log("  Student: student@learnhub.de / user1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
