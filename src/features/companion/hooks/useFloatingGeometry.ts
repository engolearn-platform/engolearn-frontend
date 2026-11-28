import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

type Mode = "mascot" | "compact" | "expanded";
type Rect = { x: number; y: number; w: number; h: number };
type Viewport = { w: number; h: number };
type Gesture = { id: number; target: HTMLElement; startX: number; startY: number; original: Rect; current: Rect; moved: boolean; resize: boolean; mode: Mode };
const key = (mode: Mode) => "engolearn.companion.geometry.v1." + mode;
const viewport = (): Viewport => ({ w: document.documentElement.clientWidth, h: window.innerHeight });
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function read(mode: Mode): Rect | null {
  try {
    const v = JSON.parse(localStorage.getItem(key(mode)) ?? "null");
    return v && [v.x, v.y, v.w, v.h].every(Number.isFinite) && v.w > 0 && v.h > 0 ? v : null;
  } catch { return null; }
}

function fit(mode: Mode, v: Viewport, saved: Rect | null): Rect {
  if (mode === "mascot") {
    const size = Math.min(v.w <= 600 ? 84 : 100, v.w, v.h);
    const inset = v.w <= 600 ? 16 : 24;
    return { x: clamp(saved?.x ?? v.w - size - inset, 0, v.w - size),
      y: clamp(saved?.y ?? v.h - size - inset, 0, v.h - size), w: size, h: size };
  }
  const margin = 12;
  const maxW = Math.max(1, v.w - 2 * margin), maxH = Math.max(1, v.h - 2 * margin);
  const wide = mode === "expanded";
  const w = clamp(saved?.w ?? (wide ? 1000 : 440), Math.min(wide ? 560 : 350, maxW), maxW);
  const h = clamp(saved?.h ?? (wide ? 810 : 720), Math.min(320, maxH), maxH);
  return { w, h, x: clamp(saved?.x ?? (wide ? (v.w - w) / 2 : v.w - w - 20), margin, Math.max(margin, v.w - w - margin)),
    y: clamp(saved?.y ?? (wide ? (v.h - h) / 2 : v.h - h - 20), margin, Math.max(margin, v.h - h - margin)) };
}

export function useFloatingGeometry(mode: Mode, enabled = true) {
  const [view, setView] = useState(viewport);
  const [preferences, setPreferences] = useState(() => ({ mascot: read("mascot"), compact: read("compact"), expanded: read("expanded") }));
  const [preview, setPreview] = useState<{ mode: Mode; rect: Rect } | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const rect = preview?.mode === mode ? preview.rect : fit(mode, view, preferences[mode]);
  const save = (next: Rect | null) => {
    setPreferences(old => ({ ...old, [mode]: next }));
    try {
      if (next) localStorage.setItem(key(mode), JSON.stringify(next));
      else localStorage.removeItem(key(mode));
    } catch { /* session geometry still works when storage is unavailable */ }
  };
  useEffect(() => {
    const cancel = () => {
      const g = gesture.current;
      gesture.current = null;
      if (g) {
        suppressClick.current = true;
        if (g.target.hasPointerCapture(g.id)) g.target.releasePointerCapture(g.id);
      }
      setPreview(null);
    };
    const update = () => { cancel(); setView(viewport()); };
    window.addEventListener("resize", update);
    window.addEventListener("blur", cancel);
    update();
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("blur", cancel);
      const g = gesture.current;
      gesture.current = null;
      if (g?.target.hasPointerCapture(g.id)) g.target.releasePointerCapture(g.id);
    };
  }, [mode, enabled]);

  function change(original: Rect, dx: number, dy: number, resize: boolean) {
    if (!resize) return fit(mode, view, { ...original, x: original.x + dx, y: original.y + dy });
    const minW = Math.min(mode === "expanded" ? 560 : 350, Math.max(1, view.w - 24));
    const minH = Math.min(320, Math.max(1, view.h - 24));
    return fit(mode, view, { ...original,
      w: clamp(original.w + dx, minW, Math.max(minW, view.w - original.x - 12)),
      h: clamp(original.h + dy, minH, Math.max(minH, view.h - original.y - 12)) });
  }
  function start(event: PointerEvent<HTMLElement>, resize = false) {
    if (!enabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
    suppressClick.current = false;
    const target = event.currentTarget;
    gesture.current = { id: event.pointerId, target, startX: event.clientX, startY: event.clientY,
      original: rect, current: rect, moved: false, resize, mode };
    target.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId || g.mode !== mode) return;
    const dx = event.clientX - g.startX, dy = event.clientY - g.startY;
    if (!g.moved && Math.hypot(dx, dy) < (mode === "mascot" ? 8 : 5)) return;
    if (!g.moved) {
      g.moved = true;
      g.target.setPointerCapture(g.id);
    }
    event.preventDefault();
    g.current = change(g.original, dx, dy, g.resize);
    setPreview({ mode, rect: g.current });
  }
  function end(event: PointerEvent<HTMLElement>, cancel = false) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    suppressClick.current = g.moved || cancel;
    if (g.moved && !cancel && g.mode === mode) save(g.current);
    setPreview(null);
    if (g.target.hasPointerCapture(g.id)) g.target.releasePointerCapture(g.id);
    return !g.moved && !cancel;
  }
  function step(dx: number, dy: number, resize = false) {
    if (enabled && !gesture.current) save(change(rect, dx, dy, resize));
  }
  function reset() { if (enabled && !gesture.current) save(null); }
  function keyboard(event: KeyboardEvent<HTMLElement>, resize = false) {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (event.key === "Home") { event.preventDefault(); reset(); }
    else if (delta) {
      event.preventDefault();
      const n = event.shiftKey ? 80 : 20;
      step(delta[0] * n, delta[1] * n, resize);
    }
  }
  return { rect, dragging: preview?.mode === mode, start, move, end, step, reset, keyboard, suppressClick,
    style: enabled ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h, right: "auto", bottom: "auto" } : undefined };
}
