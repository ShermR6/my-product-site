import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const email = session.user.email;

  // Link any unlinked licenses to this user
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.license.updateMany({
      where: { purchaseEmail: email, userId: null },
      data: { userId: user.id },
    });
  }

  const licenses = await prisma.license.findMany({
    where: { purchaseEmail: email },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(licenses);
}
