// app/layout.tsx
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "FinalPing",
  description: "Real-time aircraft tracking with proximity alerts.",
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