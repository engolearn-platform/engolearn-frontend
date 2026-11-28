import { forwardRef, useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import type { EngoMotionSettings } from "@features/companion/hooks/useEngoMotionPreference";

const ROOT = "/assets/engo";
const FRAMES = Array.from({ length: 6 }, (_, index) => ROOT + "/motion-frames-v1/reading-" + index + ".webp");
const FINE = "(hover: hover) and (pointer: fine)";
type Step = readonly [frame: number, holdMs: number];
const READING: readonly Step[] = [[1, 300], [0, 650], [3, 900], [5, 380], [0, 240]];
const ATTENTION: readonly Step[] = [[2, 320], [4, 320], [5, 300]];

interface MascotButtonProps {
  onClick: () => void;
  motion: EngoMotionSettings;
  processing: boolean;
  routeKey: string;
}

export const MascotButton = forwardRef<HTMLButtonElement, MascotButtonProps>(
  function MascotButton({ onClick, motion, processing, routeKey }, ref) {
    const [ready, setReady] = useState(false);
    const [frame, setFrame] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [hover, setHover] = useState(false);
    const [focus, setFocus] = useState(false);
    const [visible, setVisible] = useState(() => !document.hidden);
    const first = useRef(true);
    const mountedAt = useRef(performance.now());
    const lastTabAt = useRef(-Infinity);
    const attention = hover || focus;
    const pose = processing ? "working" : attention ? "attention" : "reading";

    useEffect(() => {
      let cancelled = false;
      const preload = FRAMES.map(src => { const image = new Image(); image.src = src; return image; });
      Promise.all(preload.map(image => image.decode()))
        .then(() => { if (!cancelled) setReady(true); })
        .catch(() => { if (!cancelled) setReady(false); });
      return () => { cancelled = true; };
    }, []);

    useEffect(() => {
      const fine = window.matchMedia(FINE);
      const visibility = () => {
        setVisible(!document.hidden);
        if (document.hidden) { setHover(false); setFocus(false); }
      };
      const pointerMode = () => { if (!fine.matches) setHover(false); };
      const keyboard = (event: KeyboardEvent) => { if (event.key === "Tab") lastTabAt.current = performance.now(); };
      document.addEventListener("visibilitychange", visibility);
      document.addEventListener("keydown", keyboard, true);
      fine.addEventListener("change", pointerMode);
      return () => {
        document.removeEventListener("visibilitychange", visibility);
        document.removeEventListener("keydown", keyboard, true);
        fine.removeEventListener("change", pointerMode);
      };
    }, []);

    useEffect(() => { first.current = true; }, [motion.preference, routeKey]);

    useEffect(() => {
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const later = (callback: () => void, ms: number) => {
        timer = setTimeout(() => { if (!cancelled && !document.hidden) callback(); }, ms);
      };
      setPlaying(false);
      setFrame(0);
      if (!ready || !visible || !motion.enabled) return;
      const play = (sequence: readonly Step[], done: () => void) => {
        let index = 0;
        setPlaying(true);
        const step = () => {
          const [next, ms] = sequence[index++];
          setFrame(next);
          later(() => {
            if (index < sequence.length) step();
            else { setPlaying(false); done(); }
          }, ms);
        };
        step();
      };
      const schedule = () => {
        later(() => { first.current = false; play(READING, schedule); },
          first.current ? 500 : 3500 + Math.floor(Math.random() * 900));
      };
      if (processing) setFrame(5);
      else if (attention) later(() => play(ATTENTION, () => setFrame(5)), 130);
      else schedule();
      return () => { cancelled = true; clearTimeout(timer); };
    }, [ready, visible, motion.enabled, motion.preference, processing, attention, routeKey]);

    const renderedFrame = motion.enabled && ready && visible ? frame : 0;
    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        className="companion-mascot"
        aria-label={processing ? "Mở Engo — đang xử lý câu hỏi" : "Mở Engo"}
        data-pose={pose}
        data-frame={renderedFrame}
        data-playing={playing && motion.enabled && visible ? "true" : undefined}
        data-frames-ready={ready}
        data-motion-preference={motion.preference}
        data-motion-enabled={motion.enabled}
        onClick={onClick}
        onPointerEnter={event => {
          if (event.pointerType === "mouse" && window.matchMedia(FINE).matches) setHover(true);
        }}
        onPointerLeave={() => setHover(false)}
        onFocus={event => {
          const now = performance.now();
          // Closing the panel restores focus but must not trigger a new greeting.
          setFocus(event.currentTarget.matches(":focus-visible") &&
            (now - mountedAt.current >= 350 || now - lastTabAt.current < 250));
        }}
        onBlur={() => setFocus(false)}
      >
        <img src={ready ? FRAMES[renderedFrame] : ROOT + "/engo-master.webp"} alt="" className="companion-mascot-mark" draggable={false} />
        <span className="companion-mascot-hint" aria-hidden="true">{processing ? "Engo đang xử lý…" : "Hỏi Engo"}</span>
      </Button>
    );
  }
);
