"use client";

// The approach as a row of steps: one per alert ring, then "Landed". Shows
// which alerts have gone out and which ring comes next.

import { Check } from "lucide-react";
import { clock, etaMinutes, ringKey } from "../_lib/format";
import type { LiveAircraft } from "../_lib/types";

export type LadderStep = {
  key: string;
  label: string;
  state: "done" | "next" | "waiting";
  note: string;
};

/** Pure: the steps for one aircraft's approach. `rings` is widest first. */
export function ladderSteps(rings: number[], sent: Map<string, Date>, a: LiveAircraft | null): LadderStep[] {
  const steps: LadderStep[] = [];
  let nextTaken = false;
  const closing = !!a && !a.on_ground && a.is_approaching;

  for (const r of rings) {
    const at = sent.get(ringKey(r));
    const passed = !!at || (closing && a!.distance_nm < r);
    if (passed) {
      steps.push({ key: ringKey(r), label: `${r} nm`, state: "done", note: at ? `Sent ${clock(at)}` : "Passed" });
    } else if (closing && !nextTaken) {
      nextTaken = true;
      const m = etaMinutes(a!.distance_nm - r, a!.velocity_kts);
      steps.push({ key: ringKey(r), label: `${r} nm`, state: "next", note: m ? `Next · about ${m} min` : "Next" });
    } else {
      steps.push({ key: ringKey(r), label: `${r} nm`, state: "waiting", note: "Waiting" });
    }
  }

  const landed = sent.get("landing");
  const allRingsDone = steps.length > 0 && steps.every((s) => s.state === "done");
  if (landed) steps.push({ key: "landing", label: "Landed", state: "done", note: `Sent ${clock(landed)}` });
  else if (closing && allRingsDone) steps.push({ key: "landing", label: "Landed", state: "next", note: "Next" });
  else steps.push({ key: "landing", label: "Landed", state: "waiting", note: "Waiting" });
  return steps;
}

export default function ApproachLadder({ steps, vertical }: { steps: LadderStep[]; vertical?: boolean }) {
  if (vertical) {
    return (
      <div>
        {steps.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
            <Mark state={s.state} size={18} />
            <span style={{ flex: 1, fontSize: 13, color: s.state === "waiting" ? "var(--muted)" : "var(--text)" }}>
              {s.key === "landing" ? "Landed" : s.state === "done" ? `Crossed ${s.label}` : `Crosses ${s.label}`}
            </span>
            <span className="mono" style={{ fontSize: 11.5, color: s.state === "next" ? "var(--accent)" : "var(--faint)" }}>
              {s.note.replace(/^Sent /, "").replace(/^Next · /, "")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fa-ladder">
      {steps.map((s, i) => (
        <LadderPiece key={s.key} step={s} prev={steps[i - 1]} first={i === 0} />
      ))}
    </div>
  );
}

function LadderPiece({ step, prev, first }: { step: LadderStep; prev?: LadderStep; first: boolean }) {
  const line = step.state === "done" ? "done" : step.state === "next" && prev?.state === "done" ? "active" : "";
  return (
    <>
      {!first && <div className={`fa-ladder-line ${line}`} />}
      <div className="fa-ladder-step">
        <Mark state={step.state} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: step.state === "waiting" ? "var(--muted)" : "var(--text)" }}>{step.label}</div>
          <div className="mono" style={{ fontSize: 11, color: step.state === "next" ? "var(--accent)" : "var(--faint)" }}>{step.note}</div>
        </div>
      </div>
    </>
  );
}

function Mark({ state, size = 22 }: { state: LadderStep["state"]; size?: number }) {
  return (
    <span className={`fa-ladder-mark ${state === "done" ? "done" : state === "next" ? "next" : ""}`} style={{ width: size, height: size }}>
      {state === "done" && <Check size={size - 9} strokeWidth={3} aria-hidden="true" />}
    </span>
  );
}
