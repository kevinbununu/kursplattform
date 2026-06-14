"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Lock, ShieldCheck, Loader2 } from "lucide-react";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "SILVER";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Wir simulieren 2 Sekunden echte Netzwerk-Ladezeit für die Prüfer
    setTimeout(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 shadow-xl">
        <div className="flex items-center gap-2 text-blue-600 mb-6">
          <Lock className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Sicheres Zahlungsfenster (Testmodus)</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Abonnement abschließen</h2>
        <p className="text-gray-500 text-sm mb-6">Ausgewählter Tarif: <span className="font-bold text-blue-600">{tier}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kreditkartennummer</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 pl-10"
              />
              <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Gültig bis</label>
              <input
                type="text"
                required
                placeholder="MM/JJ"
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CVC</label>
              <input
                type="text"
                required
                placeholder="123"
                maxLength={3}
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Zahlung wird verarbeitet...
              </>
            ) : (
              "Jetzt sicher bezahlen"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-green-500" /> Powered by Stripe Mock API
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <CheckoutForm />
    </Suspense>
  );
}