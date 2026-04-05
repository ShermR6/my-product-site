// app/groundstationdevices/page.tsx
import Link from "next/link";

const devices = [
  {
    tier: "Budget",
    price: "~$40",
    badge: "Best for beginners",
    badgeColor: "#22d3a3",
    name: "RTL-SDR Blog V4 + Antenna Kit",
    description:
      "The most popular entry-level ADS-B receiver. Comes with everything you need to get started — dongle, antenna, and cables. Works on Windows, Mac, Linux, and Raspberry Pi.",
    specs: ["Tunes 500kHz – 1.7GHz", "1PPM TCXO for accuracy", "USB-C connector", "Includes dipole antenna kit", "Works with dump1090 out of the box"],
    amazon: "https://www.amazon.com/RTL-SDR-Blog-RTL2832U-Software-Defined/dp/B0CD7558GT",
    image: "https://m.media-amazon.com/images/I/61zMEzSt4jL._AC_SL1500_.jpg",
    note: "Requires driver update on first install — instructions included.",
  },
  {
    tier: "Mid-range",
    price: "~$45",
    badge: "Most recommended",
    badgeColor: "#0ea5e9",
    popular: true,
    name: "FlightAware Pro Stick Plus",
    description:
      "Purpose-built for ADS-B tracking with a built-in 1090MHz bandpass filter and low-noise amplifier. Significantly better range than generic dongles, especially in urban areas with RF interference.",
    specs: ["Built-in 1090MHz bandpass filter", "19dB integrated amplifier", "20–100% more range vs generic dongles", "Plug and play with PiAware", "No driver setup needed"],
    amazon: "https://www.amazon.com/FlightAware-FA-PROSTICKPLUS-1-Receiver-Built-Filter/dp/B01M7REJJW",
    image: "https://m.media-amazon.com/images/I/71it4FmVFbL._AC_SL1500_.jpg",
    note: "Best choice for most users. Works immediately with FinalPing Ground Station.",
  },
  {
    tier: "Best performance",
    price: "~$40",
    badge: "Premium quality",
    badgeColor: "#a78bfa",
    name: "ADSBexchange Blue SDR + Antenna",
    description:
      "ADS-B Exchange's own purpose-built receiver. Includes an industrial-grade microSD with software pre-loaded, onboard 1090MHz filter, amp, and a proper 5dBi antenna. Just add a Raspberry Pi.",
    specs: ["0.5PPM TCXO — most accurate", "Onboard 1090MHz filter + amp", "Includes 8\" 5dBi 1090MHz antenna", "Industrial microSD with software", "No command line setup required"],
    amazon: "https://www.amazon.com/ADSBexchange-com-RTL2832U-Antenna-Software-Industrial/dp/B09F2ND4R6",
    image: "https://m.media-amazon.com/images/I/71RWN0tO3gL._AC_SL1500_.jpg",
    note: "Best signal quality. Comes with antenna purpose-built for 1090MHz.",
  },
  {
    tier: "Complete kit",
    price: "~$80–100",
    badge: "Everything included",
    badgeColor: "#f59e0b",
    name: "CanaKit Raspberry Pi 4 Starter Kit",
    description:
      "If you don't have a Raspberry Pi yet, this CanaKit comes with everything — Pi 4 board, case, power supply, SD card, and cables. Pair it with any of the receivers above.",
    specs: ["Raspberry Pi 4 4GB RAM", "32GB pre-loaded MicroSD", "Official case + fan", "USB-C power supply", "All cables included"],
    amazon: "https://www.amazon.com/CanaKit-Raspberry-4GB-Starter-Kit/dp/B07V5JTMV9",
    image: "https://m.media-amazon.com/images/I/71GnMN3G03L._AC_SL1200_.jpg",
    note: "You still need a receiver dongle — pair with the FlightAware Pro Stick Plus above.",
  },
];

export default function GroundStationDevicesPage() {
  return (
    <main className="page">
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}>
            📡 HARDWARE GUIDE
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Recommended ADS-B Receivers
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.7 }}>
            These receivers all work with FinalPing Ground Station and dump1090. Pick one based on your budget and setup.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/groundstationsetup" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              color: "var(--muted)", fontSize: 13, fontWeight: 600, textDecoration: "none",
              transition: "all 0.15s",
            }}>
              📖 Setup Guide →
            </Link>
            <Link href="/pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              background: "var(--accent)", border: "1px solid var(--accent)",
              color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              Buy Ground Station →
            </Link>
          </div>
        </div>

        {/* What you need section */}
        <div style={{
          background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)",
          borderRadius: 14, padding: "20px 24px", marginBottom: 48,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>What you need</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              To use FinalPing Ground Station you need a computer or Raspberry Pi, an ADS-B receiver dongle, and an antenna.
              Most receiver kits include an antenna. All run dump1090 which FinalPing reads from.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>Minimum setup</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              Any Windows, Mac, or Linux computer + RTL-SDR Blog V4 with antenna. Total cost around $40.
              A Raspberry Pi makes a better dedicated setup that runs 24/7.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>Already have gear?</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              Any RTL-SDR dongle running dump1090, dump1090-fa, readsb, or PiAware will work.
              FinalPing reads the standard JSON feed at port 8080.
            </div>
          </div>
        </div>

        {/* Device cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {devices.map((d) => (
            <div key={d.name} style={{
              background: d.popular ? "linear-gradient(135deg, rgba(14,165,233,0.07), rgba(14,165,233,0.02))" : "rgba(255,255,255,0.02)",
              border: d.popular ? "1px solid rgba(14,165,233,0.25)" : "1px solid var(--border)",
              borderRadius: 16, padding: "28px 32px",
              display: "grid", gridTemplateColumns: "140px 1fr auto", gap: 28, alignItems: "start",
            }}>
              {/* Image */}
              <div style={{
                width: 140, height: 140, borderRadius: 12, overflow: "hidden",
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
              </div>

              {/* Info */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "3px 10px", borderRadius: 999,
                    background: `${d.badgeColor}18`, border: `1px solid ${d.badgeColor}40`,
                    color: d.badgeColor,
                  }}>
                    {d.badge}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{d.tier}</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>{d.name}</h2>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 14px", maxWidth: 540 }}>{d.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {d.specs.map(s => (
                    <span key={s} style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 999,
                      background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
                {d.note && (
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "12px 0 0", fontStyle: "italic" }}>
                    ⚠️ {d.note}
                  </p>
                )}
              </div>

              {/* Price + button */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{d.price}</div>
                <a
                  href={d.amazon}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 999,
                    background: "#f59e0b", color: "#000",
                    fontSize: 13, fontWeight: 700, textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Buy on Amazon →
                </a>
                <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right" }}>Ships via Amazon</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: 64 }}>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>
            Once you have your hardware, follow the setup guide to get everything running.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/groundstationsetup" style={{
              padding: "11px 24px", borderRadius: 999,
              background: "var(--accent)", color: "#fff",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>
              View Setup Guide →
            </Link>
            <Link href="/pricing" style={{
              padding: "11px 24px", borderRadius: 999,
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Buy Ground Station
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
