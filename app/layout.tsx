// app/layout.tsx
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "My Product",
  description: "Product info, purchase, downloads, and support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="page">
          <div className="container">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}