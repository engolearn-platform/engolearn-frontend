import { useCallback, useEffect, useState } from "react";

export type EngoMotionPreference = "system" | "on" | "off";
const KEY = "engolearn.companion.motion.v1";
const REDUCE = "(prefers-reduced-motion: reduce)";

function parse(value: string | null): EngoMotionPreference {
  return value === "on" || value === "off" ? value : "system";
}

function read(): EngoMotionPreference {
  try { return parse(window.localStorage.getItem(KEY)); } catch { return "system"; }
}

/** Device-local visual preference only; never part of learner or chat state. */
export function useEngoMotionPreference() {
  const [preference, setPreference] = useState(read);
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCE).matches);
  useEffect(() => {
    const media = window.matchMedia(REDUCE);
    const update = () => setReduced(media.matches);
    const storage = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) setPreference(read());
    };
    media.addEventListener("change", update);
    window.addEventListener("storage", storage);
    update();
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("storage", storage);
    };
  }, []);
  const savePreference = useCallback((value: EngoMotionPreference) => {
    try {
      window.localStorage.setItem(KEY, value);
      setPreference(value);
      return true;
    } catch { return false; }
  }, []);
  return { preference, reduced, enabled: preference === "on" || (preference === "system" && !reduced), savePreference };
}

export type EngoMotionSettings = ReturnType<typeof useEngoMotionPreference>;
