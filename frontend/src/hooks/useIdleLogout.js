import { useEffect, useRef } from "react";

// Logs the user out after `timeoutMs` of no interaction. Only real user
// input resets the timer (clicks, keys, scroll, touch) — background polling
// or API calls never count as activity, so a page left open but untouched
// still expires on schedule.
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "wheel"];

const useIdleLogout = (enabled, timeoutMs, onIdle) => {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return undefined;

    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [enabled, timeoutMs]);
};

export default useIdleLogout;
