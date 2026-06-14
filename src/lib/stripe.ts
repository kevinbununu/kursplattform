// src/lib/stripe.ts
import Stripe from "stripe";
import { SubscriptionTier } from "@prisma/client";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia",
  typescript: true,
});

// ─── Subscription Plan Config ────────────────────────────────────────────────

export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number; // EUR
  stripePriceId: string | undefined;
  features: string[];
  courseAccess: string[];
  highlighted?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    tier: SubscriptionTier.FREE,
    name: "Free",
    description: "Einstieg ohne Kosten",
    priceMonthly: 0,
    stripePriceId: undefined,
    features: [
      "Zugriff auf kostenlose Kurse",
      "Community-Forum",
      "Basis-Fortschrittsanzeige",
    ],
    courseAccess: ["Kostenlose Kurse"],
  },
  {
    tier: SubscriptionTier.BRONZE,
    name: "Bronze",
    description: "Ideal für Einsteiger",
    priceMonthly: 9,
    stripePriceId: process.env.STRIPE_PRICE_BRONZE,
    features: [
      "Alles aus Free",
      "Zugriff auf Bronze-Kurse",
      "Zertifikate nach Abschluss",
      "E-Mail-Support",
    ],
    courseAccess: ["Kostenlose Kurse", "Bronze-Kurse"],
  },
  {
    tier: SubscriptionTier.SILVER,
    name: "Silber",
    description: "Für ambitionierte Lernende",
    priceMonthly: 19,
    stripePriceId: process.env.STRIPE_PRICE_SILVER,
    features: [
      "Alles aus Bronze",
      "Zugriff auf Silber-Kurse",
      "Downloads & Offline-Zugriff",
      "Prioritäts-Support",
    ],
    courseAccess: ["Kostenlose Kurse", "Bronze-Kurse", "Silber-Kurse"],
    highlighted: true,
  },
  {
    tier: SubscriptionTier.GOLD,
    name: "Gold",
    description: "Maximaler Zugang",
    priceMonthly: 39,
    stripePriceId: process.env.STRIPE_PRICE_GOLD,
    features: [
      "Alles aus Silber",
      "Zugriff auf alle Gold-Kurse",
      "1:1 Mentoring-Sessions",
      "Früher Zugang zu neuen Kursen",
      "Exklusive Community",
    ],
    courseAccess: ["Alle Kurse"],
  },
];

// ─── Tier Hierarchy ───────────────────────────────────────────────────────────

const TIER_RANK: Record<SubscriptionTier, number> = {
  FREE: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
};

export function canAccessCourse(
  userTier: SubscriptionTier,
  requiredTier: string
): boolean {
  const required = requiredTier as SubscriptionTier;
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

// ─── Stripe Helpers ───────────────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(userId: string, email: string) {
  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
