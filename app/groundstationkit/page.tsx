"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CartItem = { tier: string; name: string; price: number; quantity: number };
type ShippingRate = { carrier: string; service: string; token: string; amount: number; days: number | null };
type Address = { name: string; line1: string; line2: string; city: string; state: string; zip: string };

const KITS = [
  {
    id: "standard",
    name: "Standard Kit",
    subtitle: "Raspberry Pi Zero 2 W + Pro Stick Plus + Stand Antenna",
    description: "Everything you need to run a full ADS-B ground station. Self-assemble and flash, or have it done for you.",
    imgs: [
      { src: "/ground/814LpKbBx3L._AC_SL1500_.jpg", label: "Pi Zero 2 W" },
      { src: "/ground/ProStick_Plus_open.jpg", label: "Pro Stick Plus" },
      { src: "/ground/51jXcyrG51L._AC_SL1001_.jpg", label: "Stand Antenna" },
    ],
    basePrice: 200,
    builtPrice: 225,
    tier: "ground-station-kit",
    builtTier: "ground-station-kit-built",
    includes: ["Raspberry Pi Zero 2 W Starter Kit", "FlightAware Pro Stick Plus", "2.5dBi Stand Antenna"],
  },
  {
    id: "stubby",
    name: "Stubby Kit",
    subtitle: "Raspberry Pi Zero 2 W + Pro Stick Plus + Stubby Antenna",
    description: "Same full kit with the compact 6dBi stubby antenna — direct mount, higher gain, cleaner setup.",
    imgs: [
      { src: "/ground/814LpKbBx3L._AC_SL1500_.jpg", label: "Pi Zero 2 W" },
      { src: "/ground/ProStick_Plus_open.jpg", label: "Pro Stick Plus" },
      { src: "/ground/stubby-antenna.jpg", label: "Stubby Antenna" },
    ],
    basePrice: 220,
    builtPrice: 245,
    tier: "ground-station-kit-stubby",
    builtTier: "ground-station-kit-stubby-built",
    includes: ["Raspberry Pi Zero 2 W Starter Kit", "FlightAware Pro Stick Plus", "6dBi Stubby Antenna"],
    popular: true,
  },
];

const PARTS = [
  {
    id: "pro-stick-plus",
    name: "FlightAware Pro Stick Plus",
    description: "1090MHz bandpass filter with 19dB low-noise amplifier.",
    img: "/ground/ProStick_Plus_open.jpg",
    price: 57,
    tier: "pro-stick-plus",
  },
  {
    id: "stand-antenna",
    name: "1090MHz Stand Antenna",
    description: "2.5dBi magnetic base with 1m cable and adapter.",
    img: "/ground/51jXcyrG51L._AC_SL1001_.jpg",
    price: 15,
    tier: "stand-antenna",
  },
  {
    id: "stubby-antenna",
    name: "1090MHz Stubby Antenna",
    description: "Compact direct-mount 6dBi antenna with higher gain than the standard stand antenna.",
    img: "/ground/stubby-antenna.jpg",
    price: 30,
    tier: "stubby-antenna-solo",
  },
];

function CartSidebar({
  cart,
  onClose,
  onRemove,
  onQty,
}: {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (tier: string) => void;
  onQty: (tier: string, delta: number) => void;
}) {
  const [address, setAddress] = useState<Address>({ name: "", line1: "", line2: "", city: "", state: "", zip: "" });
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (selectedRate?.amount ?? 0);
  const canGetRates = !!(address.name && address.line1 && address.city && address.state && /^\d{5}$/.test(address.zip));

  const setField = (f: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress(prev => ({ ...prev, [f]: e.target.value }));

  useEffect(() => {
    setRates([]);
    setSelectedRate(null);
  }, [cart, address.zip]);

  const fetchRates = async () => {
    if (!canGetRates) return;
    setRatesLoading(true);
    setRatesError(null);
    setRates([]);
    setSelectedRate(null);
    try {
      const res = await fetch("/api/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: address.zip, items: cart.map(i => ({ tier: i.tier, quantity: i.quantity })) }),
      });
      const data = await res.json();
      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        setSelectedRate(data.rates[0]);
      } else {
        setRatesError(data.error ?? "No shipping rates found for this ZIP");
      }
    } catch {
      setRatesError("Could not fetch shipping rates");
    } finally {
      setRatesLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedRate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart.map(i => ({ tier: i.tier, quantity: i.quantity })),
          shippingRate: { label: selectedRate.service, amount: selectedRate.amount, days: selectedRate.days },
          shippingAddress: address,
        }),
      });
      const data = await res.json();
      if (res.status === 401 || data.requireLogin) {
        router.push("/login?callbackUrl=/groundstationkit");
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError("Something went wrong.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
    color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, backdropFilter: "blur(2px)" }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 400,
        background: "var(--panel, #111)", borderLeft: "1px solid var(--border)",
        zIndex: 101, display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
            Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20, lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {cart.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginTop: 48 }}>
              Your cart is empty
            </div>
          ) : (
            <>
              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {cart.map(item => (
                  <div key={item.tier} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>${item.price} each</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => item.quantity === 1 ? onRemove(item.tier) : onQty(item.tier, -1)}
                        style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", minWidth: 16, textAlign: "center" }}>{item.quantity}</span>
                      <button
                        onClick={() => onQty(item.tier, 1)}
                        style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >+</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", minWidth: 40, textAlign: "right" }}>
                      ${item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping section */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Shipping Address
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input style={inp} placeholder="Full name *" value={address.name} onChange={setField("name")} />
                  <input style={inp} placeholder="Street address *" value={address.line1} onChange={setField("line1")} />
                  <input style={{ ...inp, color: address.line2 ? "var(--text)" : "var(--muted)" }} placeholder="Apt, suite, etc. (optional)" value={address.line2} onChange={setField("line2")} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...inp, flex: 1 }} placeholder="City *" value={address.city} onChange={setField("city")} />
                    <input
                      style={{ ...inp, width: 56, flex: "none", textTransform: "uppercase" }}
                      placeholder="State"
                      maxLength={2}
                      value={address.state}
                      onChange={e => setAddress(prev => ({ ...prev, state: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") }))}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...inp, flex: 1 }}
                      placeholder="ZIP code *"
                      inputMode="numeric"
                      value={address.zip}
                      onChange={e => setAddress(prev => ({ ...prev, zip: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                      onKeyDown={e => e.key === "Enter" && fetchRates()}
                    />
                    <button
                      onClick={fetchRates}
                      disabled={ratesLoading || !canGetRates}
                      style={{
                        padding: "9px 14px", borderRadius: 8, border: "none",
                        background: ratesLoading || !canGetRates ? "rgba(14,165,233,0.3)" : "#0ea5e9",
                        color: "#fff", fontSize: 12, fontWeight: 700,
                        cursor: ratesLoading || !canGetRates ? "default" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ratesLoading ? "..." : "Get Rates"}
                    </button>
                  </div>
                </div>

                {ratesError && (
                  <div style={{ fontSize: 11, color: "#f87171", marginTop: 8 }}>{ratesError}</div>
                )}

                {rates.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                    {rates.map(rate => (
                      <button
                        key={rate.token}
                        onClick={() => setSelectedRate(rate)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                          border: selectedRate?.token === rate.token
                            ? "1px solid rgba(14,165,233,0.6)"
                            : "1px solid var(--border)",
                          background: selectedRate?.token === rate.token
                            ? "rgba(14,165,233,0.08)"
                            : "rgba(255,255,255,0.02)",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{rate.service}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>Ships via USPS</div>
                        </div>
                        <div style={{
                          fontSize: 13, fontWeight: 800,
                          color: selectedRate?.token === rate.token ? "var(--accent)" : "var(--text)",
                        }}>
                          ${rate.amount.toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Fixed footer */}
        {cart.length > 0 && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Subtotal</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>${subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Shipping</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: selectedRate ? "var(--text)" : "var(--muted)" }}>
                {selectedRate ? `$${selectedRate.amount.toFixed(2)}` : "Enter address above"}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading || !selectedRate}
              style={{
                display: "block", width: "100%", padding: "13px",
                borderRadius: 10, border: "none",
                background: loading || !selectedRate ? "rgba(14,165,233,0.4)" : "#0ea5e9",
                color: "#fff", fontSize: 14, fontWeight: 800,
                cursor: loading || !selectedRate ? "default" : "pointer",
              }}
            >
              {loading ? "Loading..." : selectedRate ? `Checkout — $${total.toFixed(2)}` : "Select Shipping to Continue"}
            </button>
            {error && <div style={{ fontSize: 11, color: "#f87171", marginTop: 8, textAlign: "center" }}>{error}</div>}
          </div>
        )}
      </div>
    </>
  );
}

function KitCard({ kit, onAdd }: { kit: typeof KITS[0]; onAdd: (tier: string, name: string, price: number) => void }) {
  const [built, setBuilt] = useState(false);
  const price = built ? kit.builtPrice : kit.basePrice;

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: kit.popular ? "1px solid rgba(14,165,233,0.4)" : "1px solid var(--border)",
      background: "rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column", position: "relative",
    }}>
      {kit.popular && (
        <div style={{
          position: "absolute", top: 14, right: 14, zIndex: 1,
          fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
          textTransform: "uppercase", padding: "3px 10px", borderRadius: 999,
          background: "var(--accent)", color: "#000",
        }}>Popular</div>
      )}

      {/* 3-image grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid var(--border)" }}>
        {kit.imgs.map((img, i) => (
          <div key={img.label} style={{
            background: "rgba(255,255,255,0.04)", padding: "20px 12px",
            borderRight: i < 2 ? "1px solid var(--border)" : "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.label} style={{ height: 80, width: "100%", objectFit: "contain" }} />
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, textAlign: "center" }}>{img.label}</div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ padding: "20px 20px 0", flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{kit.name}</div>
        <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>{kit.subtitle}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>{kit.description}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
          {kit.includes.map(item => (
            <div key={item} style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "#22d3a3", fontWeight: 700, fontSize: 10 }}>✓</span> {item}
            </div>
          ))}
        </div>

        {/* Pre-built toggle */}
        <div
          onClick={() => setBuilt(v => !v)}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px", borderRadius: 10, marginBottom: 16, cursor: "pointer",
            border: built ? "1px solid rgba(14,165,233,0.5)" : "1px solid var(--border)",
            background: built ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.02)",
            transition: "all 0.15s",
          }}
        >
          <div style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
            border: built ? "2px solid #0ea5e9" : "2px solid rgba(255,255,255,0.25)",
            background: built ? "#0ea5e9" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}>
            {built && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              Pre-built &amp; Pre-flashed
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
                background: "rgba(14,165,233,0.15)", color: "var(--accent)", border: "1px solid rgba(14,165,233,0.3)",
              }}>+$25</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
              Assembled and pre-loaded. Plug in, connect WiFi, done.
            </div>
          </div>
        </div>
      </div>

      {/* Add to Cart */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>${price}</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>+ shipping</span>
        </div>
        <button
          onClick={() => onAdd(
            built ? kit.builtTier : kit.tier,
            built ? `${kit.name} (Pre-built)` : kit.name,
            price
          )}
          style={{
            display: "block", width: "100%", padding: "12px", borderRadius: 10, border: "none",
            background: "#0ea5e9", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
          }}
        >
          Add to Cart →
        </button>
      </div>
    </div>
  );
}

function PartCard({ part, onAdd }: { part: typeof PARTS[0]; onAdd: (tier: string, name: string, price: number) => void }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(part.tier, part.name, part.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", padding: 24,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: "1px solid var(--border)", height: 160,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={part.img} alt={part.name} style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain" }} />
      </div>
      <div style={{ padding: "16px 16px 0", flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{part.name}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>{part.description}</div>
      </div>
      <div style={{ padding: "12px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>${part.price}</span>
        <button
          onClick={handleAdd}
          style={{
            padding: "8px 16px", borderRadius: 8,
            border: added ? "1px solid rgba(34,211,163,0.4)" : "1px solid rgba(14,165,233,0.3)",
            background: added ? "rgba(34,211,163,0.1)" : "rgba(14,165,233,0.1)",
            color: added ? "#22d3a3" : "var(--accent)",
            fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default function GroundStationKitPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (tier: string, name: string, price: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.tier === tier);
      if (existing) return prev.map(i => i.tier === tier ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { tier, name, price, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (tier: string) => setCart(prev => prev.filter(i => i.tier !== tier));

  const updateQty = (tier: string, delta: number) => {
    setCart(prev => prev.map(i => i.tier === tier ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  return (
    <main className="page">
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Breadcrumb + cart button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 6, alignItems: "center" }}>
            <Link href="/groundstationdevices" style={{ color: "var(--muted)", textDecoration: "none" }}>Hardware Guide</Link>
            <span>›</span>
            <span style={{ color: "var(--text)" }}>Ground Station Hardware</span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10, cursor: "pointer",
              border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
              color: "var(--text)", fontSize: 13, fontWeight: 600,
            }}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 800, minWidth: 20, height: 20,
                borderRadius: 999, background: "#0ea5e9", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
              }}>{cartCount}</span>
            )}
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", padding: "3px 12px", borderRadius: 999, marginBottom: 14,
            background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", color: "var(--accent)",
          }}>
            FinalPing Official Store
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Ground Station Hardware
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, maxWidth: 560, margin: 0 }}>
            Everything you need for a local ADS-B receiver. All parts sourced, tested, and ready to run with FinalPing.
          </p>
        </div>

        {/* Kits */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Complete Kits</h2>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>2 products</span>
          </div>
          <div style={{
            padding: "14px 18px", borderRadius: 12, marginBottom: 20,
            background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)",
            fontSize: 13, color: "var(--muted)", lineHeight: 1.7,
          }}>
            💡 <strong style={{ color: "var(--text)" }}>Perfect if your computer isn&apos;t on 24/7.</strong>{" "}
            The Raspberry Pi runs silently in the background on its own power — no PC required, no interruptions to your tracking.
            Set it up once and forget it; updates to the ground station software are a single command.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {KITS.map(kit => <KitCard key={kit.id} kit={kit} onAdd={addToCart} />)}
          </div>
        </div>

        {/* Individual Parts */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Individual Parts</h2>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>3 products</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px" }}>
            Already have some of the hardware? Pick up just what you need.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {PARTS.map(part => <PartCard key={part.id} part={part} onAdd={addToCart} />)}
          </div>
        </div>

        {/* Bottom note */}
        <div style={{
          marginTop: 56, padding: "20px 24px", borderRadius: 14,
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap" as const, gap: 16,
        }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            All orders ship within 3–5 business days. USPS shipping calculated at checkout.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/groundstationsetup" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>Setup guide →</Link>
            <Link href="/groundstationdevices" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>Hardware guide →</Link>
          </div>
        </div>

      </div>

      {cartOpen && (
        <CartSidebar
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onQty={updateQty}
        />
      )}
    </main>
  );
}
