// src/components/layout/pricing-card.tsx
"use client";

import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlanConfig } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  plan: PlanConfig;
}

export function PricingCard({ plan }: PricingCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubscribe = async () => {
    if (!session) {
      router.push("/register");
      return;
    }
    if (plan.tier === "FREE") {
      router.push("/dashboard");
      return;
    }

    // 🔮 WEITERLEITUNG INS FORMULAR:
    // Schickt den Nutzer auf unsere neue, interaktive Checkout-Seite
    router.push(`/checkout?tier=${plan.tier}`);
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-6 flex flex-col",
        plan.highlighted
          ? "border-blue-500 shadow-lg shadow-blue-100 bg-blue-600 text-white"
          : "border-gray-200 bg-white"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Beliebt
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={cn("font-bold text-xl mb-1", plan.highlighted ? "text-white" : "text-gray-900")}>
          {plan.name}
        </h3>
        <p className={cn("text-sm", plan.highlighted ? "text-blue-100" : "text-gray-500")}>
          {plan.description}
        </p>
      </div>

      <div className="mb-6">
        <span className={cn("text-4xl font-bold", plan.highlighted ? "text-white" : "text-gray-900")}>
          €{plan.priceMonthly}
        </span>
        <span className={cn("text-sm ml-1", plan.highlighted ? "text-blue-100" : "text-gray-500")}>
          / Monat
        </span>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", plan.highlighted ? "text-blue-200" : "text-green-500")} />
            <span className={plan.highlighted ? "text-blue-50" : "text-gray-600"}>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        className={cn(
          "w-full py-3 rounded-xl font-semibold transition-colors text-sm",
          plan.highlighted
            ? "bg-white text-blue-600 hover:bg-blue-50"
            : "bg-gray-900 text-white hover:bg-gray-700"
        )}
      >
        {plan.tier === "FREE" ? "Kostenlos starten" : `${plan.name} wählen`}
      </button>
    </div>
  );
}