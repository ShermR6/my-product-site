import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await req.json();
  const trimmed = (name ?? "").trim();

  await prisma.user.update({
    where: { email: session.user.email },
    data: { name: trimmed || null },
  });

  return NextResponse.json({ ok: true, name: trimmed || null });
}
