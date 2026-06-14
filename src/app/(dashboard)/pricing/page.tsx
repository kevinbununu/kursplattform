// src/app/(dashboard)/pricing/page.tsx
import { PLANS } from "@/lib/stripe";
import { PricingCard } from "@/components/layout/pricing-card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const currentTier = session?.user?.subscriptionTier ?? "FREE";

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900">Abo & Preise</h1>
        <p className="text-gray-500 mt-1">
          Aktueller Plan:{" "}
          <span className="font-medium text-gray-800 capitalize">{currentTier.toLowerCase()}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map((plan) => (
          <div key={plan.tier} className="relative">
            {plan.tier === currentTier && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Aktuell
                </span>
              </div>
            )}
            <PricingCard plan={plan} />
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Abo verwalten</h3>
        <p className="text-sm text-gray-600 mb-4">
          Kündige, wechsle oder pausiere dein Abonnement jederzeit über das Stripe-Portal.
        </p>
        <ManageSubscriptionButton />
      </div>
    </div>
  );
}

// Client component for portal redirect
function ManageSubscriptionButton() {
  return (
    <form
      action="/api/stripe/portal"
      method="POST"
    >
      {/* This is a server action workaround — use client component below */}
      <ManageButton />
    </form>
  );
}

// Separate client component
import { ManageButton } from "@/components/layout/manage-button";
