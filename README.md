# Projekt-Mitglieder : 
Kevin Wolfram , Jegor Geer 770337 , Kirill Korsun 770330 , Abbas Sharba




# LearnHub – SaaS Kursplattform

> Web Engineering Projekt · Next.js 14 · PostgreSQL · Prisma · Stripe · Tailwind CSS



---

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Datenbank | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 (Credentials + JWT) |
| Styling | Tailwind CSS + eigene UI-Komponenten |
| Payments | Stripe (Subscriptions + Checkout) |
| Deployment | Vercel (empfohlen) |

---

## Projektstruktur

```
kursplattform/
├── prisma/
│   ├── schema.prisma          # Datenbankschema
│   └── seed.ts                # Testdaten
├── src/
│   ├── app/
│   │   ├── (marketing)/       # Öffentliche Seiten (Landing, Pricing)
│   │   ├── (auth)/            # Login & Registrierung
│   │   ├── (dashboard)/       # Geschützte App-Seiten
│   │   │   ├── dashboard/     # User-Dashboard + Meine Kurse
│   │   │   ├── courses/       # Kurskatalog + Kursdetail + Player
│   │   │   ├── creator/       # Creator Studio + Analytics
│   │   │   ├── admin/         # Admin-Panel
│   │   │   ├── pricing/       # Abo-Seite
│   │   │   └── settings/      # Nutzerprofil & Abo-Verwaltung
│   │   └── api/
│   │       ├── auth/          # NextAuth + Registrierung
│   │       ├── courses/       # CRUD Kurse, Module, Lektionen
│   │       ├── progress/      # Lernfortschritt
│   │       ├── stripe/        # Checkout, Webhook, Portal
│   │       ├── analytics/     # Creator-Analytics
│   │       ├── admin/         # User-Verwaltung
│   │       └── user/          # Profil-Update
│   ├── components/
│   │   ├── ui/                # Button, Badge, Toaster
│   │   ├── layout/            # Sidebar, Pricing Card, Forms
│   │   ├── course/            # CourseBuilder, CoursePlayer
│   │   └── dashboard/         # AdminUserTable
│   ├── lib/
│   │   ├── prisma.ts          # DB-Client (Singleton)
│   │   ├── auth.ts            # NextAuth-Konfiguration
│   │   ├── stripe.ts          # Stripe-Client + Plan-Config
│   │   └── utils.ts           # Hilfsfunktionen
│   ├── hooks/                 # useCourseProgress, useFetch
│   ├── types/                 # TypeScript-Typen + NextAuth-Erweiterung
│   └── middleware.ts          # Route-Protection
```

---

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Fülle folgende Werte aus:

```env
DATABASE_URL="postgresql://USER:PASS@localhost:5432/kursplattform"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

STRIPE_PRICE_BRONZE="price_..."
STRIPE_PRICE_SILVER="price_..."
STRIPE_PRICE_GOLD="price_..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Datenbank einrichten

```bash
# Schema pushen (Development)
npm run db:push

# Testdaten laden
npm run db:seed
```

### 4. Stripe einrichten (Testmodus)

1. Stripe Dashboard → **Products** → 3 Produkte anlegen:
   - Bronze: €9/Monat → Price ID in `STRIPE_PRICE_BRONZE`
   - Silber: €19/Monat → Price ID in `STRIPE_PRICE_SILVER`
   - Gold: €39/Monat → Price ID in `STRIPE_PRICE_GOLD`

2. Stripe CLI für Webhooks (lokal):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# → Kopiere das `whsec_...` Secret in STRIPE_WEBHOOK_SECRET
```

### 5. Entwicklungsserver starten

```bash
npm run dev
# → http://localhost:3000
```

---

## Test-Accounts (nach Seed)

| Rolle | E-Mail | Passwort | Abo |
|---|---|---|---|
| Admin | admin@learnhub.de | admin1234 | Gold |
| Creator | creator@learnhub.de | creator1234 | Silber |
| Student | student@learnhub.de | user1234 | Bronze |

---

## Rollen & Zugriffsrechte

| Route | USER | CREATOR | ADMIN |
|---|---|---|---|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/courses` | ✅ | ✅ | ✅ |
| `/courses/*/learn` | ✅ (bei Zugriff) | ✅ | ✅ |
| `/creator` | ❌ | ✅ | ✅ |
| `/creator/analytics` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |

---

## Abo-Modell

| Plan | Preis | Kurs-Zugang |
|---|---|---|
| Free | €0 | Kostenlose Kurse |
| Bronze | €9/Monat | Free + Bronze-Kurse |
| Silber | €19/Monat | Free + Bronze + Silber-Kurse |
| Gold | €39/Monat | Alle Kurse |

---

## Epics – Umsetzungsstatus

| Epic | Beschreibung | Status |
|---|---|---|
| Epic 0 | Landingpage, Hero, Features, Pricing | ✅ |
| Epic 1 | Auth, Rollen, Abo-Modell | ✅ |
| Epic 2 | Kurs-Builder (Module, Lektionen) | ✅ |
| Epic 3 | Content Management (Text, Video-URL) | ✅ |
| Epic 4 | Kurs-Player mit Navigation | ✅ |
| Epic 5 | Fortschritts-Tracking (% + abgeschlossen) | ✅ |
| Epic 6 | Stripe Checkout + Webhooks | ✅ |
| Epic 7 | Analytics-Dashboard für Creator | ✅ |

---

## Deployment auf Vercel

```bash
# Vercel CLI
npm i -g vercel
vercel

# Umgebungsvariablen setzen:
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... etc.
```

Datenbank-Empfehlung: **Supabase** (PostgreSQL, kostenloser Tier) oder **Neon**.

---

## Stripe Test-Karten

| Karte | Nummer |
|---|---|
| Erfolgreich | 4242 4242 4242 4242 |
| Abgelehnt | 4000 0000 0000 0002 |
| 3D Secure | 4000 0025 0000 3155 |

Datum: beliebig in der Zukunft · CVC: beliebige 3 Ziffern
