// src/types/next-auth.d.ts
import { Role, SubscriptionTier } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      subscriptionTier: SubscriptionTier;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    subscriptionTier: SubscriptionTier;
  }
}
