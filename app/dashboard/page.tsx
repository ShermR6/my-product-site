import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import DashboardClient from "./DashboardClient";

const prisma = new PrismaClient();

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { license: true },
  });

  return (
    <DashboardClient
      user={{
        email: session.user.email,
        name: session.user.name ?? null,
      }}
      license={user?.license ?? null}
      justPurchased={searchParams.success === "1"}
    />
  );
}
