// src/components/layout/dashboard-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, PlusCircle, BarChart2,
  Settings, LogOut, GraduationCap, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role, SubscriptionTier } from "@prisma/client";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
    subscriptionTier: SubscriptionTier;
  };
}

const TIER_BADGES: Record<SubscriptionTier, { label: string; className: string }> = {
  FREE: { label: "Free", className: "bg-gray-100 text-gray-600" },
  BRONZE: { label: "Bronze", className: "bg-orange-100 text-orange-700" },
  SILVER: { label: "Silber", className: "bg-slate-100 text-slate-700" },
  GOLD: { label: "Gold", className: "bg-yellow-100 text-yellow-700" },
};

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const badge = TIER_BADGES[user.subscriptionTier];

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Übersicht", roles: ["USER", "CREATOR", "ADMIN"] },
    { href: "/courses", icon: BookOpen, label: "Kurse entdecken", roles: ["USER", "CREATOR", "ADMIN"] },
    { href: "/dashboard/my-courses", icon: GraduationCap, label: "Meine Kurse", roles: ["USER", "CREATOR", "ADMIN"] },
    { href: "/creator", icon: PlusCircle, label: "Creator Studio", roles: ["CREATOR", "ADMIN"] },
    { href: "/creator/analytics", icon: BarChart2, label: "Analytics", roles: ["CREATOR", "ADMIN"] },
    { href: "/admin", icon: Shield, label: "Admin", roles: ["ADMIN"] },
  ].filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="font-bold text-xl text-gray-900">LearnHub</Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", badge.className)}>
              {badge.label}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-1 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" /> Einstellungen
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 px-1 py-1.5 rounded-lg hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Abmelden
          </button>
        </div>
      </div>
    </aside>
  );
}
