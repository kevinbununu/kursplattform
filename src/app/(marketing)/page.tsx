// src/app/(marketing)/page.tsx
import Link from "next/link";
import { ArrowRight, BookOpen, Users, TrendingUp, Award, CheckCircle } from "lucide-react";
import { PLANS } from "@/lib/stripe";
import { PricingCard } from "@/components/layout/pricing-card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">LearnHub</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Anmelden
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Jetzt in der Beta – kostenlos loslegen
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Wissen teilen.<br />
            <span className="text-blue-600">Einnahmen generieren.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            LearnHub ist die SaaS-Kursplattform für Creators und Lernende. Erstelle Kurse,
            verwalte Inhalte und monetarisiere dein Wissen – alles in einem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-lg"
            >
              Kostenlos starten <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-lg"
            >
              Kurse entdecken
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Alles, was du brauchst
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Von der Kurserstellung bis zur Monetarisierung – LearnHub deckt den kompletten Workflow ab.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Kurse erstellen",
                desc: "Strukturiere dein Wissen in Module und Lektionen. Lade Videos, Texte und Materialien hoch.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: Users,
                title: "Community aufbauen",
                desc: "Verwalte Teilnehmer, verfolge den Lernfortschritt und baue eine loyale Lerncommunity auf.",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: TrendingUp,
                title: "Analytics",
                desc: "Sieh auf einen Blick, wie viele Teilnehmer deine Kurse absolvieren und welche Lektionen beliebt sind.",
                color: "bg-purple-100 text-purple-600",
              },
              {
                icon: Award,
                title: "Monetarisierung",
                desc: "Verkaufe Kurse per Einmalkauf oder über Abonnements mit Stripe – sicher und einfach.",
                color: "bg-orange-100 text-orange-600",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Transparente Preise
            </h2>
            <p className="text-gray-600 text-lg">
              Starte kostenlos. Upgrade, wenn du bereit bist.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <PricingCard key={plan.tier} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-bold text-gray-900">LearnHub</span>
          <p className="text-sm text-gray-500">© 2024 LearnHub. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
