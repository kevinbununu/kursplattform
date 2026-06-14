"use client";

import { useRouter } from "next/navigation";

export function ManageButton() {
  const router = useRouter();

  const handleManage = () => {
    // 🔮 Leitet direkt auf die neue geschützte Dashboard-Preisseite weiter
    router.push("/billing");
  };

  return (
    <button
      onClick={handleManage}
      className="bg-gray-900 text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
    >
      Abo verwalten →
    </button>
  );
}