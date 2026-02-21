// app/components/Navbar.tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="container">
        <div className="nav-inner">
          <Link className="brand" href="/">
            <span className="dot" />
            <span>SkyPing</span>
          </Link>

          <nav className="nav-links">
            <Link className="nav-link" href="/">
              Product
            </Link>
            <Link className="nav-link" href="/pricing">
              Purchase
            </Link>
            <Link className="nav-link" href="/download">
              Download
            </Link>
            <Link className="nav-link" href="/contact">
              Contact Us
            </Link>
            <Link className="nav-link btn btn-outline" href="/login">
              Log in
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}