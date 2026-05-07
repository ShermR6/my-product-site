import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json();
  const licenseKey = params.key.toUpperCase();

  if (action === "revoke") {
    const license = await prisma.license.update({
      where: { licenseKey },
      data: {
        status: "revoked",
        expiresAt: new Date(),
      },
    });
    return NextResponse.json(license);
  }

  if (action === "delete") {
    await prisma.license.delete({ where: { licenseKey } });
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
