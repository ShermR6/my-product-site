// app/api/internal/entitlement/route.ts
// What an account is entitled to, by email — no password needed.
// Protected by the internal secret; never expose this publicly.
//
// /api/auth/verify answers this as part of a password login. The desktop
// backends also need it where there is no password to check: Google sign-in,
// and refreshing on /api/user/me so a cancelled or upgraded plan takes effect
// without waiting for the user to log out.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validInternalSecret } from "@/lib/internalSecret";
import { getEntitlement, FREE } from "@/lib/entitlement";

export async function POST(req: NextRequest) {
  if (!validInternalSecret(req.headers.get("x-internal-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, product } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalized = String(email).toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  });

  // No account row is not an error: a licence can carry a purchase email that
  // never signed up. getEntitlement falls back to matching on that.
  const entitlement = await getEntitlement(normalized, user?.id ?? null, product);

  return NextResponse.json({ email: normalized, entitlement: entitlement ?? FREE });
}
