import { useEffect, useRef, useState } from "react";

export function useContentReadiness(identity: string, required: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [readyIdentity, setReadyIdentity] = useState("");
  useEffect(() => {
    if (!required) return;
    const bottom = bottomRef.current;
    const content = contentRef.current;
    if (!bottom || !content) return;
    const check = (revalidate = false) => {
      const available = window.innerHeight - (footerRef.current?.getBoundingClientRect().height ?? 0);
      const bounds = bottom.getBoundingClientRect();
      if (bounds.bottom <= available && bounds.top >= 0) setReadyIdentity(identity);
      else if (revalidate) setReadyIdentity("");
    };
    const observeBottom = () => check();
    const revalidate = () => check(true);
    const observer = new IntersectionObserver(observeBottom);
    observer.observe(bottom);
    const resize = new ResizeObserver(revalidate);
    resize.observe(content);
    if (footerRef.current) resize.observe(footerRef.current);
    window.addEventListener("scroll", observeBottom, { passive: true });
    window.addEventListener("resize", revalidate);
    check();
    return () => { observer.disconnect(); resize.disconnect(); window.removeEventListener("scroll", observeBottom); window.removeEventListener("resize", revalidate); };
  }, [identity, required]);
  return { contentRef, bottomRef, footerRef, ready: !required || readyIdentity === identity };
}
