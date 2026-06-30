import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    courseId: string;
  };
};

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              progress: {
                where: {
                  userId: session.user.id,
                  completed: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  const lessons = course.modules.flatMap((m) => m.lessons);
  const completedLessons = lessons.filter((l) => l.progress.length > 0);

  if (lessons.length === 0 || completedLessons.length !== lessons.length) {
    return NextResponse.json(
      { error: "Kurs noch nicht vollständig abgeschlossen" },
      { status: 403 }
    );
  }

  const userName = session.user.name || session.user.email || "Teilnehmer";
  const date = new Date().toLocaleDateString("de-DE");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(0.15, 0.35, 0.9),
    borderWidth: 4,
  });

  page.drawText("LearnHub", {
    x: 60,
    y: height - 90,
    size: 24,
    font: boldFont,
    color: rgb(0.15, 0.35, 0.9),
  });

  page.drawText("ZERTIFIKAT", {
    x: 300,
    y: height - 150,
    size: 42,
    font: boldFont,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText("Hiermit wird bestätigt, dass", {
    x: 310,
    y: height - 210,
    size: 16,
    font,
  });

  page.drawText(userName, {
    x: 270,
    y: height - 260,
    size: 30,
    font: boldFont,
    color: rgb(0.15, 0.35, 0.9),
  });

  page.drawText("den folgenden Kurs erfolgreich abgeschlossen hat:", {
    x: 245,
    y: height - 310,
    size: 16,
    font,
  });

  page.drawText(course.title, {
    x: 250,
    y: height - 360,
    size: 26,
    font: boldFont,
  });

  page.drawText(`Abschlussdatum: ${date}`, {
    x: 330,
    y: height - 430,
    size: 14,
    font,
  });

  page.drawText("LearnHub - SaaS Kursplattform", {
    x: 315,
    y: 80,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="zertifikat-${course.title}.pdf"`,
    },
  });
}