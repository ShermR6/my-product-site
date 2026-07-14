import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ground Station Kit",
  description:
    "Build your own FinalPing Ground Station with a complete ADS-B receiver kit. Pre-configured hardware bundles and individual parts for sub-10-second local landing and takeoff alerts.",
};

export default function GroundStationKitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
