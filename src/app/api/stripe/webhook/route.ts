// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";

const TIER_MAP: Record<string, SubscriptionTier> = {
  BRONZE: SubscriptionTier.BRONZE,
  SILVER: SubscriptionTier.SILVER,
  GOLD: SubscriptionTier.GOLD,
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[WEBHOOK] Invalid signature:", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier as string;

      if (!userId || !tier) break;

      await prisma.subscription.upsert({
        where: { userId },
        update: {
          tier: TIER_MAP[tier] ?? SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: session.subscription as string,
        },
        create: {
          userId,
          tier: TIER_MAP[tier] ?? SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: session.subscription as string,
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const statusMap: Record<string, SubscriptionStatus> = {
        active: SubscriptionStatus.ACTIVE,
        canceled: SubscriptionStatus.CANCELED,
        past_due: SubscriptionStatus.PAST_DUE,
        trialing: SubscriptionStatus.TRIALING,
      };

      await prisma.subscription.update({
        where: { userId },
        data: {
          status: statusMap[subscription.status] ?? SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.CANCELED,
          stripeSubscriptionId: null,
        },
      });
      break;
    }
  }

  return new NextResponse(null, { status: 200 });
}
