"use client";

import { SessionProvider } from "next-auth/react";
import PostHogProvider from "./PostHogProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProvider>{children}</PostHogProvider>
    </SessionProvider>
  );
}
