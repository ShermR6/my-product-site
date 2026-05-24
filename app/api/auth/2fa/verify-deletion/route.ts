// Verifies a 2FA code and permanently deletes the account if valid.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import * as OTPAuth from "otpauth";
const bcrypt = require("bcryptjs");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://aircraft-tracker-backend-production.up.railway.app";
const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "finalping-internal-secret";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const email = session.user.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const method = user.pendingPasswordMethod;

  if (method === "totp") {
    if (!user.twoFactorTotpSecret) {
      return NextResponse.json({ error: "TOTP not configured" }, { status: 400 });
    }
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorTotpSecret),
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
    if (delta === null) {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
    }
  } else {
    if (!user.pendingPasswordCode || !user.pendingPasswordExpiry) {
      return NextResponse.json({ error: "No verification code found. Please start over." }, { status: 400 });
    }
    if (new Date() > user.pendingPasswordExpiry) {
      await prisma.user.update({
        where: { email },
        data: { pendingPasswordCode: null, pendingPasswordExpiry: null, pendingPasswordMethod: null },
      });
      return NextResponse.json({ error: "Code expired. Please start over." }, { status: 400 });
    }
    const isValid = await bcrypt.compare(code.trim(), user.pendingPasswordCode);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
    }
  }

  // Code verified — proceed with deletion
  try {
    const customers = await stripe.customers.list({ email, limit: 5 });
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 10 });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/internal/user`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ email }),
    });
    if (!backendRes.ok) {
      const body = await backendRes.text().catch(() => "");
      console.error(`Backend user delete failed: ${backendRes.status} ${body}`);
      throw new Error("Backend user deletion failed");
    }

    // Delete all Prisma-side licenses before deleting the user
    await prisma.license.deleteMany({ where: { userId: user.id } });

    await prisma.user.delete({ where: { email } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
