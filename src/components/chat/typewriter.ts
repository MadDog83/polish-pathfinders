import { useEffect, useMemo, useState } from "react";

// Reveals an answer word by word after it has arrived in full. The text is already
// sanitized on the server (citations checked, URLs whitelisted) before any of it is shown;
// this is only a visual effect, never a stream of unchecked model output.

const LINK = /\[[^\]\n]*\]\([^)\s]*\)/g;
const TICK_MS = 30;
const MAX_DURATION_MS = 2500;

/** Words with their trailing spaces; a markdown link is one token, never shown half-typed. */
export function tokenize(text: string): string[] {
  const words = (s: string) => s.match(/\S+\s*|\s+/g) ?? [];
  const tokens: string[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const at = m.index ?? 0;
    tokens.push(...words(text.slice(last, at)), m[0]);
    last = at + m[0].length;
  }
  tokens.push(...words(text.slice(last)));
  return tokens;
}

/** Closes a bold or code span the cut left open, so no stray "**" flashes on screen. */
export function closeOpenMarks(partial: string): string {
  let out = partial;
  if ((out.match(/\*\*/g) ?? []).length % 2) out += "**";
  if ((out.match(/`/g) ?? []).length % 2) out += "`";
  return out;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The part of `text` to show right now. While `active`, it grows every tick until the
 * whole text is visible, then calls `onDone`. Long answers reveal several tokens per tick
 * so no answer takes longer than MAX_DURATION_MS.
 */
export function useTypewriter(
  text: string,
  active: boolean,
  onDone: () => void,
  onProgress?: () => void,
): string {
  const tokens = useMemo(() => tokenize(text), [text]);
  const [shown, setShown] = useState(active ? 0 : tokens.length);

  useEffect(() => {
    if (!active) {
      setShown(tokens.length);
      return;
    }
    if (prefersReducedMotion() || tokens.length === 0) {
      setShown(tokens.length);
      onDone();
      return;
    }
    const step = Math.max(1, Math.ceil(tokens.length / (MAX_DURATION_MS / TICK_MS)));
    let count = 0;
    setShown(0);
    const timer = window.setInterval(() => {
      count = Math.min(tokens.length, count + step);
      setShown(count);
      onProgress?.();
      if (count >= tokens.length) {
        window.clearInterval(timer);
        onDone();
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
    // onDone/onProgress are callbacks from the parent; restarting on their identity would
    // replay the animation on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tokens]);

  return shown >= tokens.length ? text : closeOpenMarks(tokens.slice(0, shown).join(""));
}
