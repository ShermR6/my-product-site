// app/components/footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>© {new Date().getFullYear()} FinalPing</div>
          <div className="footer-links">
            <Link href="/contact">Support</Link>
            <Link href="/download">Download</Link>
            <Link href="/pricing">Purchase</Link>
            <Link href="/changelog">Changelog</Link>
            <Link href="/status">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}