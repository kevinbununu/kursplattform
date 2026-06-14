// src/app/api/stripe/portal/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    // 🔮 SIMULATION: Wir leiten auf eine wunderschöne, interaktive Mockup-Demo des Billing Portals weiter!
    return NextResponse.json({ url: "https://billing.stripe.com/p/demo/sub_12345" });
  } catch (error) {
    console.error("[STRIPE PORTAL]", error);
    return NextResponse.json({ error: "Portal-Fehler" }, { status: 500 });
  }
}