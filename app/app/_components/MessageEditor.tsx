"use client";

// The alert wording, edited the way it will read: bold shows as bold and each
// fill-in (tail number, distance…) is a chip, not {curly} text. The saved form
// is unchanged: the tracker's template text, **bold** and {fields}.

import { useCallback, useEffect, useRef, useState } from "react";
import { Bold } from "lucide-react";

export const MESSAGE_FIELDS: { key: string; label: string }[] = [
  { key: "tail_number", label: "Tail number" },
  { key: "distance", label: "Distance" },
  { key: "eta", label: "ETA" },
  { key: "runway", label: "Runway" },
  { key: "airport", label: "Airport" },
  { key: "speed", label: "Speed" },
  { key: "altitude", label: "Altitude" },
  { key: "time", label: "Time" },
];
const LABEL: Record<string, string> = { tail: "Tail number", ...Object.fromEntries(MESSAGE_FIELDS.map((f) => [f.key, f.label])) };

export const MESSAGE_FIELD_KEYS = new Set(Object.keys(LABEL));

function token(key: string): HTMLElement {
  const el = document.createElement("span");
  el.className = "fa-token";
  el.contentEditable = "false";
  el.dataset.field = key;
  el.textContent = LABEL[key];
  return el;
}

/** Template text -> what the editor shows. */
function build(root: HTMLElement, template: string) {
  root.textContent = "";
  const parts = template.split("**");
  // An odd number of ** means one of them is just text.
  if (parts.length % 2 === 0) {
    const last = parts.pop() as string;
    parts[parts.length - 1] += `**${last}`;
  }
  parts.forEach((part, i) => {
    if (!part) return;
    let into: HTMLElement = root;
    if (i % 2 === 1) { into = document.createElement("b"); root.appendChild(into); }
    for (const piece of part.split(/(\{\w+\}|\n)/)) {
      if (!piece) continue;
      const m = /^\{(\w+)\}$/.exec(piece);
      if (piece === "\n") into.appendChild(document.createElement("br"));
      else if (m && LABEL[m[1]]) into.appendChild(token(m[1]));
      else into.appendChild(document.createTextNode(piece));
    }
  });
}

type Run = { text: string; bold: boolean };

function collect(node: Node, bold: boolean, runs: Run[]) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      runs.push({ text: (child.textContent ?? "").replace(/\u200B/g, "").replace(/\u00A0/g, " "), bold });
      continue;
    }
    if (!(child instanceof HTMLElement)) continue;
    if (child.dataset.field) {
      // The Bold button can put the bold inside a chip as well as around it.
      runs.push({ text: `{${child.dataset.field}}`, bold: bold || !!child.querySelector("b, strong, [style*='font-weight']") });
      continue;
    }
    if (child.tagName === "BR") { runs.push({ text: "\n", bold: false }); continue; }
    // Browsers that wrap each line in a block: a new block is a new line.
    if (/^(DIV|P)$/.test(child.tagName) && runs.length && !runs[runs.length - 1].text.endsWith("\n")) runs.push({ text: "\n", bold: false });
    const weight = child.style.fontWeight;
    const strong = /^(B|STRONG)$/.test(child.tagName) || weight === "bold" || Number(weight) >= 600;
    collect(child, (bold || strong) && weight !== "normal", runs);
  }
}

/** What the editor shows -> template text. */
function serialize(root: HTMLElement): string {
  const runs: Run[] = [];
  collect(root, false, runs);
  // The browser keeps a spare line break at the very end so the last line can hold the cursor.
  let end: Node | null = root.lastChild;
  while (end?.lastChild) end = end.lastChild;
  if (end?.nodeName === "BR" && runs.length) runs.pop();
  let out = "";
  let i = 0;
  while (i < runs.length) {
    let text = runs[i].text;
    const bold = runs[i].bold;
    for (i++; i < runs.length && runs[i].bold === bold; i++) text += runs[i].text;
    if (!bold) { out += text; continue; }
    // Discord and friends only make it bold when the ** hug the words.
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)!;
    out += m[2] ? `${m[1]}**${m[2]}**${m[3]}` : text;
  }
  return out;
}

export default function MessageEditor({
  value, onChange, label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const body = useRef<HTMLDivElement>(null);
  const shown = useRef<string | null>(null);
  const caret = useRef<Range | null>(null);
  const [bold, setBold] = useState(false);

  // Redraw only when the text changes from outside (another event picked, reset), never while typing.
  useEffect(() => {
    if (!body.current || value === shown.current) return;
    build(body.current, value);
    shown.current = value;
    caret.current = null;
  }, [value]);

  const emit = useCallback(() => {
    if (!body.current) return;
    const next = serialize(body.current);
    shown.current = next;
    onChange(next);
  }, [onChange]);

  const remember = useCallback(() => {
    const sel = window.getSelection();
    if (!body.current || !sel || !sel.rangeCount || !body.current.contains(sel.anchorNode)) return;
    caret.current = sel.getRangeAt(0).cloneRange();
    try { setBold(document.queryCommandState("bold")); } catch { /* not supported: the button just doesn't light up */ }
  }, []);

  /** Put the cursor back where it was in the message, or at the end. */
  function restore(): Range {
    const root = body.current as HTMLDivElement;
    root.focus();
    const sel = window.getSelection() as Selection;
    let range = caret.current;
    if (!range || !root.contains(range.startContainer)) {
      range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
  }

  function insert(key: string) {
    const range = restore();
    range.deleteContents();
    const el = token(key);
    range.insertNode(el);
    range.setStartAfter(el);
    range.collapse(true);
    const sel = window.getSelection() as Selection;
    sel.removeAllRanges();
    sel.addRange(range);
    caret.current = range.cloneRange();
    emit();
  }

  function toggleBold() {
    restore();
    // The browser skips anything it can't edit, so the chips are opened up while it applies the bold.
    const chips = Array.from((body.current as HTMLDivElement).querySelectorAll<HTMLElement>(".fa-token"));
    chips.forEach((c) => c.removeAttribute("contenteditable"));
    document.execCommand("bold");
    chips.forEach((c) => { c.contentEditable = "false"; });
    remember();
    emit();
  }

  return (
    <div className="fa-msg-edit">
      <div
        ref={body} className="fa-msg-body" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label}
        spellCheck
        onInput={() => { remember(); emit(); }}
        onKeyUp={remember} onMouseUp={remember} onFocus={remember}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); document.execCommand("insertLineBreak"); }
        }}
        onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }}
        onDrop={(e) => e.preventDefault()}
      />
      <div className="fa-msg-bar">
        <button type="button" className="fa-msg-bold" aria-label="Bold" aria-pressed={bold} title="Bold (Ctrl+B)"
          onMouseDown={(e) => e.preventDefault()} onClick={toggleBold}>
          <Bold size={14} strokeWidth={2.6} aria-hidden="true" />
        </button>
        <span className="fa-note" style={{ fontSize: 11.5, margin: "0 2px 0 6px" }}>Insert</span>
        {MESSAGE_FIELDS.map((f) => (
          <button key={f.key} type="button" className="fa-chip selectable" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
