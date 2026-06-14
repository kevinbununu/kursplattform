// src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "CREATOR",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-gray-900">LearnHub</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Konto erstellen</h1>
          <p className="text-gray-600">Starte kostenlos – keine Kreditkarte erforderlich</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ich bin...</label>
              <div className="grid grid-cols-2 gap-3">
                {(["USER", "CREATOR"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      formData.role === r
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {r === "USER" ? "🎓 Lernender" : "✏️ Creator"}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: "Name", key: "name", type: "text", placeholder: "Max Mustermann" },
              { label: "E-Mail", key: "email", type: "email", placeholder: "name@example.com" },
              { label: "Passwort", key: "password", type: "password", placeholder: "••••••••" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  required
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Konto wird erstellt..." : "Kostenlos registrieren"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bereits ein Konto?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
