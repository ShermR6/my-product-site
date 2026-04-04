// app/api/admin/revoke-license/route.ts
// Deletes or revokes a license from the Vercel/Prisma database
// Protected by internal secret — never expose publicly

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { license_key, hard_delete } = await req.json();

  if (!license_key) {
    return NextResponse.json({ error: "license_key is required" }, { status: 400 });
  }

  const key = license_key.trim().toUpperCase();

  const license = await prisma.license.findUnique({
    where: { licenseKey: key },
  });

  if (!license) {
    return NextResponse.json({ error: "License not found" }, { status: 404 });
  }

  if (hard_delete) {
    // Permanently delete from database — disappears from dashboard entirely
    await prisma.license.delete({ where: { licenseKey: key } });
    return NextResponse.json({ message: `License ${key} permanently deleted`, license_key: key });
  } else {
    // Soft revoke — marks as revoked, still visible in dashboard but inactive
    await prisma.license.update({
      where: { licenseKey: key },
      data: {
        status: "revoked",
        expiresAt: new Date(),
      },
    });
    return NextResponse.json({ message: `License ${key} revoked`, license_key: key });
  }
}
