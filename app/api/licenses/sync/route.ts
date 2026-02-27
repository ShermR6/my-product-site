import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Verify internal secret
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { license_key, activated_at, expires_at } = await req.json();

  if (!license_key) {
    return NextResponse.json({ error: "Missing license_key" }, { status: 400 });
  }

  try {
    await prisma.license.update({
      where: { licenseKey: license_key },
      data: {
        status: "active",
        activatedAt: new Date(activated_at),
        expiresAt: new Date(expires_at),
      },
    });

    console.log(`License synced as active: ${license_key}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("License sync failed:", err);
    return NextResponse.json({ error: "License not found" }, { status: 404 });
  }
}
