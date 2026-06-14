// src/app/(dashboard)/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ManageButton } from "@/components/layout/manage-button";

const TIER_LABELS: Record<string, string> = {
  FREE: "Free", BRONZE: "Bronze", SILVER: "Silber", GOLD: "Gold",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Einstellungen</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Profil</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
              {user.role === "ADMIN" ? "Administrator" : user.role === "CREATOR" ? "Creator" : "Lernender"}
            </span>
          </div>
        </div>

        <ProfileForm name={user.name ?? ""} />
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Abonnement</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-900">
              {TIER_LABELS[user.subscription?.tier ?? "FREE"]}-Plan
            </p>
            <p className="text-sm text-gray-500 capitalize">
              Status:{" "}
              <span className={user.subscription?.status === "ACTIVE" ? "text-green-600" : "text-red-600"}>
                {user.subscription?.status === "ACTIVE" ? "Aktiv" :
                 user.subscription?.status === "CANCELED" ? "Gekündigt" :
                 user.subscription?.status ?? "Kein Abo"}
              </span>
            </p>
            {user.subscription?.currentPeriodEnd && (
              <p className="text-xs text-gray-400 mt-0.5">
                Verlängert am:{" "}
                {new Date(user.subscription.currentPeriodEnd).toLocaleDateString("de-DE")}
              </p>
            )}
          </div>
          <ManageButton />
        </div>

        {(!user.subscription || user.subscription.tier === "FREE") && (
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800 font-medium mb-1">Upgrade für mehr Kurse</p>
            <p className="text-xs text-blue-600">
              Mit einem Bronze-, Silber- oder Gold-Abo erhältst du Zugang zu exklusiven Kursen.
            </p>
            <a
              href="/pricing"
              className="inline-block mt-3 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Pläne ansehen →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline client component for profile update form
import { ProfileForm } from "@/components/layout/profile-form";
