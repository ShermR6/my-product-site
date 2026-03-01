// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="nav">
      <div className="container">
        <div className="nav-inner">
          <Link className="brand" href="/">
            <span className="dot" />
            <span>FinalPing</span>
          </Link>

          <nav className="nav-links">
            <Link className="nav-link" href="/">Product</Link>
            <Link className="nav-link" href="/pricing">Purchase</Link>
            <Link className="nav-link" href="/download">Download</Link>
            <Link className="nav-link" href="/contact">Contact Us</Link>
            {session ? (
              <Link className="nav-link btn btn-outline" href="/dashboard">Dashboard</Link>
            ) : (
              <Link className="nav-link btn btn-outline" href="/login">Log in</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
