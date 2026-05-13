import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support",
  description: "Get in touch with the FinalPing team. We respond within 1 business day.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
