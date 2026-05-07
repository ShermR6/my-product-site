import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const users = await prisma.user.findMany({
    where: search
      ? { email: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: {
        select: { licenses: true },
      },
      licenses: {
        select: { status: true },
      },
    },
  });

  const result = users.map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.createdAt,
    licenseCount: u._count.licenses,
    activeLicenseCount: u.licenses.filter((l) => l.status === "active").length,
  }));

  return NextResponse.json(result);
}
