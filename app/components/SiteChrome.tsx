"use client";

import { usePathname } from "next/navigation";

/** True for the web app at /app and everything under it. */
export function isWebAppPath(pathname: string | null): boolean {
  return pathname === "/app" || !!pathname?.startsWith("/app/");
}

/**
 * The marketing site's frame: floating navbar, centered container, footer.
 * The web app under /app has its own full-width shell, so it gets its
 * children back untouched.
 */
export default function SiteChrome({
  navbar,
  footer,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isWebAppPath(pathname)) return <>{children}</>;

  return (
    <>
      {navbar}
      <main className="page">
        <div className="container">{children}</div>
      </main>
      {footer}
    </>
  );
}
