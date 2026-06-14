// src/app/(dashboard)/billing/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLANS } from "@/lib/stripe";
import { PricingCard } from "@/components/layout/pricing-card";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Abonnement verwalten</h1>
        <p className="text-gray-500 mt-1">Hier kannst du deinen aktuellen Tarif einsehen oder wechseln.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {PLANS.map((plan) => (
          <PricingCard key={plan.tier} plan={plan} />
        ))}
      </div>
    </div>
  );
}