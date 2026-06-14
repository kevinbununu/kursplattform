// src/components/dashboard/admin-user-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  subscription: { tier: string; status: string } | null;
  _count: { enrollments: number; courses: number };
};

const TIER_LABELS: Record<string, string> = {
  FREE: "Free", BRONZE: "Bronze", SILVER: "Silber", GOLD: "Gold",
};
const TIER_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-600",
  BRONZE: "bg-orange-100 text-orange-700",
  SILVER: "bg-slate-100 text-slate-700",
  GOLD: "bg-yellow-100 text-yellow-700",
};

export function AdminUserTable({ users: initial }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initial);
  const router = useRouter();

  const updateRole = async (userId: string, role: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      router.refresh();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {["Nutzer", "Rolle", "Abo", "Kurse", "Einschreibungen", "Registriert"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">User</option>
                  <option value="CREATOR">Creator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td className="px-5 py-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${TIER_COLORS[user.subscription?.tier ?? "FREE"]}`}>
                  {TIER_LABELS[user.subscription?.tier ?? "FREE"]}
                </span>
              </td>
              <td className="px-5 py-4 text-sm text-gray-600">{user._count.courses}</td>
              <td className="px-5 py-4 text-sm text-gray-600">{user._count.enrollments}</td>
              <td className="px-5 py-4 text-xs text-gray-400">
                {new Date(user.createdAt).toLocaleDateString("de-DE")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
