// app/app/layout.tsx — the FinalPing web app. Signed-in accounts only.
import "./app.css";
import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppShell from "./_components/AppShell";

export const metadata: Metadata = {
  title: { default: "FinalPing", template: "%s | FinalPing" },
  description: "Your aircraft, live.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export default async function WebAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/app");
  return <AppShell>{children}</AppShell>;
}
