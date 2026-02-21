// app/components/footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>© {new Date().getFullYear()} My Product</div>
          <div className="footer-links">
            <Link href="/contact">Support</Link>
            <Link href="/download">Download</Link>
            <Link href="/pricing">Purchase</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}