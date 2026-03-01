// app/layout.tsx
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Providers from "./components/Providers";

export const metadata = {
  title: "FinalPing",
  description: "Real-time aircraft tracking with proximity alerts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>
          <Navbar />
          <main className="page">
            <div className="container">{children}</div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
