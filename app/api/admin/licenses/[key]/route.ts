import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json();
  const { key } = await params;
  const licenseKey = key.toUpperCase();

  if (action === "revoke") {
    const license = await prisma.license.update({
      where: { licenseKey },
      data: {
        status: "revoked",
        expiresAt: new Date(),
      },
    });

    // Expire on Railway so the desktop app loses access immediately
    try {
      await fetch(`${BACKEND_URL}/api/licenses/${licenseKey}/expire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.WEBHOOK_INTERNAL_SECRET || "",
        },
      });
    } catch (err) {
      console.error("Failed to expire license on Railway:", err);
    }

    return NextResponse.json(license);
  }

  if (action === "delete") {
    await prisma.license.delete({ where: { licenseKey } });

    // Expire on Railway so the desktop app loses access immediately
    try {
      await fetch(`${BACKEND_URL}/api/licenses/${licenseKey}/expire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.WEBHOOK_INTERNAL_SECRET || "",
        },
      });
    } catch (err) {
      console.error("Failed to expire license on Railway:", err);
    }

    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
