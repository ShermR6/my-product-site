import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INTERNAL_SECRET } from "@/lib/internalSecret";
import crypto from "crypto";

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

function generateLicenseKey(tier: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join("")
  );
  const prefix = tier.startsWith("team-") ? "FPT" : "FP";
  return `${prefix}-${segments.join("-")}`;
}

async function provisionInBackend(licenseKey: string, tier: string, email: string) {
  try {
    await fetch(`${BACKEND_URL}/api/licenses/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ license_key: licenseKey, tier, email }),
    });
  } catch (err) {
    console.error("Failed to provision license in backend:", err);
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const licenses = await prisma.license.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { licenseKey: { contains: search, mode: "insensitive" } },
              { purchaseEmail: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      licenseKey: true,
      tier: true,
      status: true,
      purchaseEmail: true,
      createdAt: true,
      activatedAt: true,
      expiresAt: true,
      userId: true,
    },
  });

  return NextResponse.json(licenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, tier } = await req.json();

  if (!email || !tier) {
    return NextResponse.json({ error: "email and tier are required" }, { status: 400 });
  }

  const licenseKey = generateLicenseKey(tier);
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const license = await prisma.license.create({
    data: {
      licenseKey,
      purchaseEmail: normalizedEmail,
      tier,
      status: "inactive",
      userId: user?.id ?? undefined,
    },
  });

  await provisionInBackend(licenseKey, tier, normalizedEmail);

  return NextResponse.json(license, { status: 201 });
}
