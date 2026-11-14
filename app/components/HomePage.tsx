// The homepage: what FinalPing does, one section per feature.
// Static markup, rendered on the server; the hero globe is the one client piece.

import Link from "next/link";
import {
  ArrowRight, Check, Clock, Code, Hash, Mail, MessageCircle, MessageSquare, Moon, Plus, Send, Smartphone, Users,
} from "lucide-react";
import "../home.css";
import HeroGlobe from "./HeroGlobe";

const PLANE =
  "M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z";

const ALERT_ROWS = [
  { title: "Landing", sub: "Aircraft lands at or near the airport", on: true },
  { title: "Takeoff", sub: "Aircraft departs from the airport", on: true },
  { title: "2 nm alert", sub: "Aircraft within 2 nautical miles", on: true },
  { title: "5 nm alert", sub: "Aircraft within 5 nautical miles", on: true },
  { title: "10 nm alert", sub: "Aircraft within 10 nautical miles", on: true },
  { title: "20 nm alert", sub: "Aircraft within 20 nautical miles", on: false },
];

const CHANNELS = [
  { icon: Hash, name: "Discord", desc: "Post to a channel via webhook" },
  { icon: Mail, name: "Email", desc: "Alert emails to any address" },
  { icon: Smartphone, name: "SMS", desc: "Text alerts to any phone number" },
  { icon: MessageCircle, name: "Slack", desc: "Post to a Slack channel" },
  { icon: Users, name: "Microsoft Teams", desc: "Send to a Teams channel" },
  { icon: MessageSquare, name: "Google Chat", desc: "Post to a Google Chat space" },
  { icon: Send, name: "Telegram", desc: "Send to a bot or channel" },
  { icon: Code, name: "Webhook", desc: "POST alert data to any endpoint" },
];

const LOG_ROWS = [
  { what: "N172AK · 5 nm from KDTO", how: "Discord, Email, SMS · 14:04" },
  { what: "N172AK · 10 nm from KDTO", how: "Discord, Email · 14:02" },
  { what: "N7678W · landed at KDTO", how: "Discord, Email · 11:37" },
  { what: "N64423 · 5 nm from KDTO", how: "Held · quiet hours · 05:12", held: true },
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="fh-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={17} strokeWidth={3} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`fh-toggle ${on ? "" : "off"}`}>
      {on ? "On" : "Off"}
      <i aria-hidden="true" />
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="fp-home">
      {/* ── Hero ── */}
      <section className="fh-hero">
        <div className="fh-wrap">
          <p className="fh-eyebrow">Aircraft arrival alerts</p>
          <h1>
            Know when your aircraft is <em>on final</em>
          </h1>
          <p className="fh-lede">
            FinalPing watches the tail numbers you care about and messages you as they close in on your airport, then
            again when they land.
          </p>
          <div className="fh-actions">
            <Link href="/app" className="fh-btn primary">
              Open the web app
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="fh-btn ghost">View pricing</Link>
          </div>

          <HeroGlobe />
        </div>
      </section>

      {/* ── 1 · Distance alerts ── */}
      <section className="fh-section">
        <div className="fh-wrap fh-split">
          <div className="fh-copy">
            <p className="fh-eyebrow">Distance alerts</p>
            <h2>Know before the wheels touch.</h2>
            <p className="fh-body">
              Pick the distances that matter and FinalPing fires an alert at each one as your aircraft closes in, then
              again when it lands or takes off.
            </p>
            <Bullets items={[
              "Alert rings at the distances you choose",
              "Different distances for each aircraft",
              "About 30 seconds from detection to alert",
            ]} />
          </div>
          <div className="fh-art" aria-hidden="true">
            <div className="fh-card">
              <div className="fh-card-head">
                <span className="fh-card-title">Alert settings</span>
                <span className="fh-card-meta">N172AK · KDTO</span>
              </div>
              {ALERT_ROWS.map((r) => (
                <div key={r.title} className={`fh-row ${r.on ? "" : "off"}`}>
                  <div>
                    <div className="fh-row-title">{r.title}</div>
                    <div className="fh-row-sub">{r.sub}</div>
                  </div>
                  <Toggle on={r.on} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · Channels ── */}
      <section className="fh-section alt">
        <div className="fh-wrap fh-split flip">
          <div className="fh-copy">
            <p className="fh-eyebrow">Integrations</p>
            <h2>Alerts go where you already are.</h2>
            <p className="fh-body">
              Connect the channels you actually check. When an aircraft crosses a ring, every one of them fires at
              once, or you choose which alerts go to which channel.
            </p>
            <p className="fh-fine">Every channel is included: Discord, email, Slack, Microsoft Teams, Google Chat, Telegram, text messages and webhooks.</p>
          </div>
          <div className="fh-art">
            <div className="fh-channels">
              {CHANNELS.map((c) => (
                <div key={c.name} className="fh-channel">
                  <c.icon size={22} strokeWidth={2} aria-hidden="true" />
                  <div className="fh-channel-name">{c.name}</div>
                  <div className="fh-channel-desc">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 · Watchlist ── */}
      <section className="fh-section">
        <div className="fh-wrap fh-split">
          <div className="fh-copy">
            <p className="fh-eyebrow">Watchlist</p>
            <h2>Watch your tails, not the whole sky.</h2>
            <p className="fh-body">
              Add an aircraft by tail number and FinalPing follows only that one. No scrolling a radar looking for it,
              and no alerts for traffic you do not care about.
            </p>
            <Bullets items={[
              "Look up by tail number",
              "Live distance, speed and altitude for each one",
              "Up to 15 aircraft on one plan",
            ]} />
          </div>
          <div className="fh-art" aria-hidden="true">
            <div className="fh-card" style={{ gap: 8 }}>
              <div className="fh-card-head" style={{ paddingBottom: 10 }}>
                <span className="fh-card-title">Aircraft</span>
                <span className="fh-card-meta">3 of 7 used</span>
              </div>
              <div className="fh-row">
                <div className="fh-ac">
                  <span className="fh-mark live" />
                  <div><div className="fh-tail">N172AK</div><div className="fh-row-sub">Alerts at 10, 5 and 2 nm</div></div>
                </div>
                <span className="fh-tag live">Inbound · 3.4 nm</span>
              </div>
              <div className="fh-row">
                <div className="fh-ac">
                  <span className="fh-mark" />
                  <div><div className="fh-tail">N64423</div><div className="fh-row-sub">Alerts at 5 and 2 nm</div></div>
                </div>
                <span className="fh-tag">Airborne · 22 nm</span>
              </div>
              <div className="fh-row">
                <div className="fh-ac">
                  <span className="fh-mark ring" />
                  <div><div className="fh-tail">N7678W</div><div className="fh-row-sub">Alerts at 10, 5 and 2 nm</div></div>
                </div>
                <span className="fh-tag">On the ground</span>
              </div>
              <div className="fh-add">
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                Add a tail number
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · Live map ── */}
      <section className="fh-section alt">
        <div className="fh-wrap fh-center">
          <p className="fh-eyebrow">Live map</p>
          <h2>See the whole approach.</h2>
          <p className="fh-body">
            Your airport, your alert rings and every aircraft on your watchlist. Each one shows how fresh its last
            position is, so you never mistake an old fix for a live one.
          </p>
          <div className="fh-map">
            <div className="fh-map-bar">
              <span className="fh-card-title">Live Map · KDTO Denton Enterprise</span>
              <div className="fh-legend">
                <span><i />Live</span>
                <span><i className="old" />45 s old</span>
              </div>
            </div>
            <svg viewBox="0 0 1100 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of Denton Enterprise Airport with alert rings at 2, 5 and 10 nautical miles, runway 18L 36R, and two tracked aircraft with their trails">
              <rect x="0" y="0" width="1100" height="500" fill="#0A0A0A" />
              <path d="M-20 120 C 180 150, 320 60, 520 110 S 900 190, 1120 130" fill="none" stroke="#1C1C1C" strokeWidth="10" />
              <path d="M140 520 C 220 380, 380 330, 470 180 S 600 20, 640 -20" fill="none" stroke="#1C1C1C" strokeWidth="7" />
              <path d="M-20 400 C 240 360, 520 440, 780 380 S 1040 300, 1120 330" fill="none" stroke="#1C1C1C" strokeWidth="6" />
              <path d="M820 520 C 800 400, 900 300, 880 160 S 960 40, 990 -20" fill="none" stroke="#161616" strokeWidth="5" />
              <path d="M60 240 C 110 215, 180 222, 205 262 S 150 322, 95 304 S 30 268, 60 240 Z" fill="#131313" />
              <circle cx="600" cy="260" r="430" fill="none" stroke="#636363" strokeWidth="1.5" strokeDasharray="8 7" opacity="0.75" />
              <circle cx="600" cy="260" r="215" fill="rgba(255,255,255,0.02)" stroke="#8F8F8F" strokeWidth="1.5" strokeDasharray="8 7" opacity="0.85" />
              <circle cx="600" cy="260" r="86" fill="rgba(255,255,255,0.04)" stroke="#FAFAFA" strokeWidth="1.5" strokeDasharray="8 7" />
              <g style={{ fontFamily: "var(--mono)" }} fontWeight="600">
                <text x="216" y="100" fill="#A3A3A3" fontSize="13">10 nm</text>
                <text x="452" y="418" fill="#D4D4D4" fontSize="13">5 nm</text>
                <text x="660" y="330" fill="#FAFAFA" fontSize="13">2 nm</text>
                <text x="612" y="238" fill="#FFFFFF" fontSize="11">18L</text>
                <text x="612" y="290" fill="#FFFFFF" fontSize="11">36R</text>
              </g>
              <line x1="600" y1="238" x2="600" y2="282" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
              <circle cx="600" cy="260" r="5" fill="#FAFAFA" stroke="#FFFFFF" strokeWidth="2" />
              <path d="M930 40 C 860 30, 760 30, 690 44 S 606 70, 600 114" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
              <g transform="translate(600,114) rotate(180) scale(1.05)"><path fill="#38BDF8" stroke="#0A0A0A" strokeWidth="1" d={PLANE} /></g>
              <rect x="626" y="96" width="152" height="44" rx="9" fill="#1C1C1C" stroke="#404040" />
              <path d="M40 470 C 110 440, 150 400, 200 372 S 268 338, 292 318" fill="none" stroke="#8F8F8F" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <g transform="translate(292,318) rotate(52) scale(1.05)"><path fill="#8F8F8F" stroke="#0A0A0A" strokeWidth="1" d={PLANE} /></g>
              <rect className="fh-map-far" x="118" y="268" width="156" height="44" rx="9" fill="#1C1C1C" stroke="#404040" />
              <g style={{ fontFamily: "var(--mono)" }}>
                <text x="638" y="114" fill="#FAFAFA" fontSize="13" fontWeight="600">N172AK</text>
                <text x="638" y="131" fill="#38BDF8" fontSize="11.5" fontWeight="500">3.4 nm · live</text>
                <text className="fh-map-far" x="130" y="286" fill="#FAFAFA" fontSize="13" fontWeight="600">N64423</text>
                <text className="fh-map-far" x="130" y="303" fill="#D4D4D4" fontSize="11.5" fontWeight="500">7.6 nm · 45s ago</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* ── 5 · Always on ── */}
      <section className="fh-section">
        <div className="fh-wrap fh-split flip">
          <div className="fh-copy">
            <p className="fh-eyebrow">Always on</p>
            <h2>Quiet until it matters.</h2>
            <p className="fh-body">
              FinalPing keeps watching from the cloud, with nothing left open on your computer or phone. Set quiet
              hours and it holds its tongue overnight, then picks back up in the morning on its own.
            </p>
            <Bullets items={[
              "Nothing to install or keep running",
              "Quiet hours you set once",
              "A log of every alert that went out",
            ]} />
          </div>
          <div className="fh-art fh-stack" aria-hidden="true">
            <div className="fh-card fh-quiet">
              <div className="fh-quiet-id">
                <span className="fh-tile"><Moon size={22} strokeWidth={2} /></span>
                <div>
                  <div className="fh-row-title" style={{ fontSize: 15 }}>Quiet hours</div>
                  <div className="fh-row-sub" style={{ fontSize: 13 }}>23:00 to 06:00, every night</div>
                </div>
              </div>
              <Toggle on />
            </div>
            <div className="fh-card fh-log">
              <div className="fh-card-title">Logs</div>
              {LOG_ROWS.map((r) => (
                <div key={r.what} className={`fh-log-row ${r.held ? "held" : ""}`}>
                  <b>{r.what}</b>
                  <span>{r.how}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 · Ground Station ── */}
      <section className="fh-section alt">
        <div className="fh-wrap fh-split">
          <div className="fh-copy">
            <p className="fh-eyebrow">Ground Station</p>
            <h2>Your own receiver. Under 10 seconds.</h2>
            <p className="fh-body">
              Plug a FinalPing Ground Station in near your airport and it hears aircraft directly instead of waiting on
              the cloud feed. Alerts that took about 30 seconds arrive in under 10, and the map shows exactly how far
              your antenna reaches.
            </p>
            <Link href="/groundstationkit" className="fh-btn ghost small">
              See the Ground Station Kit
              <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
          <div className="fh-art" aria-hidden="true">
            <div className="fh-card fh-gs">
              <svg viewBox="0 0 520 300">
                <circle cx="260" cy="150" r="46" fill="none" stroke="#2A2A2A" strokeWidth="1.5" />
                <circle cx="260" cy="150" r="92" fill="none" stroke="#2A2A2A" strokeWidth="1.5" />
                <circle cx="260" cy="150" r="138" fill="none" stroke="#2A2A2A" strokeWidth="1.5" />
                <line x1="260" y1="6" x2="260" y2="294" stroke="#2A2A2A" strokeWidth="1.5" />
                <line x1="116" y1="150" x2="404" y2="150" stroke="#2A2A2A" strokeWidth="1.5" />
                <polygon
                  points="260,28 296,40 338,52 364,88 392,118 386,150 372,186 336,214 300,252 260,264 228,236 196,224 172,196 150,170 164,138 148,104 186,84 214,50"
                  fill="rgba(255,255,255,0.07)" stroke="#FAFAFA" strokeWidth="2" strokeDasharray="7 6" strokeLinejoin="round"
                />
                <circle cx="260" cy="150" r="6" fill="#FAFAFA" stroke="#FFFFFF" strokeWidth="2" />
                <g style={{ fontFamily: "var(--mono)" }} fontWeight="600">
                  <text x="272" y="146" fill="#FAFAFA" fontSize="12">Receiver</text>
                  <text x="256" y="20" fill="#A3A3A3" fontSize="11">N</text>
                </g>
              </svg>
              <div className="fh-compare">
                <div>
                  <div className="fh-compare-label"><span>Cloud feed</span><span className="fh-mono">about 30 s</span></div>
                  <span className="fh-meter" />
                </div>
                <div>
                  <div className="fh-compare-label strong"><span>Ground Station</span><span className="fh-mono">under 10 s</span></div>
                  <span className="fh-meter fast" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 · Teams ── */}
      <section className="fh-section">
        <div className="fh-wrap fh-split flip">
          <div className="fh-copy">
            <p className="fh-eyebrow">FinalPing for Teams · coming soon</p>
            <h2>One aircraft inbound. The whole crew knows.</h2>
            <p className="fh-body">
              Built for flight schools, FBOs and line crews. Alerts route to whoever is on duty, someone claims the
              arrival, and if nobody does it escalates before the aircraft is on the ramp.
            </p>
            <Bullets items={[
              "Shift schedule and on-duty routing",
              "Claim an arrival so two people do not walk out",
              "Escalation when an alert goes unanswered",
            ]} />
            <Link href="/waitlist" className="fh-btn ghost small">
              Join the Teams waitlist
              <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
          <div className="fh-art" aria-hidden="true">
            <div className="fh-card" style={{ gap: 6 }}>
              <div className="fh-arrival">
                <div className="fh-arrival-head">
                  <div>
                    <div className="fh-arrival-kicker">Arrival</div>
                    <div className="fh-arrival-title">N172AK · 5 nm from KDTO</div>
                  </div>
                  <span className="fh-claimed"><Check size={12} strokeWidth={3.5} />Claimed</span>
                </div>
                <div className="fh-person"><span className="fh-avatar">LC</span>Line crew has this one</div>
              </div>
              <div className="fh-duty">
                <div className="fh-card-title">On duty now</div>
                <div className="fh-duty-row">
                  <span className="fh-person"><span className="fh-avatar">LC</span>Line crew</span>
                  <span className="fh-card-meta">SMS · until 18:00</span>
                </div>
                <div className="fh-duty-row">
                  <span className="fh-person"><span className="fh-avatar">DS</span>Dispatch</span>
                  <span className="fh-card-meta">Slack · until 18:00</span>
                </div>
                <div className="fh-duty-note">
                  <Clock size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                  Unclaimed after 10 minutes, it escalates to the owner
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="fh-cta">
        <div className="fh-wrap">
          <p className="fh-eyebrow">Get started</p>
          <h2>Be at the ramp before the prop stops.</h2>
          <p className="fh-body">Open FinalPing, add a tail number, and let it watch the approach for you.</p>
          <div className="fh-actions">
            <Link href="/app" className="fh-btn primary">
              Open the web app
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="fh-btn ghost">View pricing</Link>
          </div>
          <p className="fh-cta-note">
            Questions or a bug to report? Write to{" "}
            <a href="mailto:aircraftalerts@finalpingapp.com" className="fh-textlink">aircraftalerts@finalpingapp.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
