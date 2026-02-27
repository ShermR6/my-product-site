"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const TopoBackground = dynamic(() => import("./TopoBackground"), { ssr: false });

export default function PageBackground() {
  const pathname = usePathname();
  // Homepage uses AirplaneBackground — all other pages get topo
  if (pathname === "/") return null;
  return <TopoBackground />;
}
