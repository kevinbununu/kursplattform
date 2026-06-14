import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const { tier } = await req.json();

    // 🔮 SIMULATION: Wir tragen das gewählte Abo direkt in deine Supabase-Datenbank ein!
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        tier: tier, // "BRONZE", "SILVER" oder "GOLD"
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 Tage Gültigkeit
      },
      create: {
        userId: session.user.id,
        tier: tier,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Wir leiten zurück auf das Dashboard und hängen "?success=true" an die URL
    return NextResponse.json({ 
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true` 
    });
  } catch (error) {
    console.error("[SIMULATED CHECKOUT ERROR]", error);
    return NextResponse.json({ error: "Fehler bei der Simulation" }, { status: 500 });
  }
}