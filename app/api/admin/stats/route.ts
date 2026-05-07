import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeLicenses,
    inactiveLicenses,
    expiredLicenses,
    revokedLicenses,
    recentSignups,
    recentLicenses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.license.count({ where: { status: "active" } }),
    prisma.license.count({ where: { status: "inactive" } }),
    prisma.license.count({ where: { status: "expired" } }),
    prisma.license.count({ where: { status: "revoked" } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.license.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeUsers: totalUsers,
    activeLicenses,
    inactiveLicenses,
    expiredLicenses,
    revokedLicenses,
    recentSignups,
    recentLicenses,
  });
}
