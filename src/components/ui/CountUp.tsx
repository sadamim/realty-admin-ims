'use client';

// Animated number for the dashboard tiles.
// The server already renders the final value, so the page is correct with
// JavaScript disabled and the animation is pure decoration — and it is skipped
// entirely when the visitor prefers reduced motion.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function CountUp({
  value,
  duration = 900,
  delay = 0,
  className,
}: {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useIsoLayoutEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || value <= 0) {
      setDisplay(value);
      return;
    }

    setDisplay(0);

    const start = () => {
      const startedAt = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        setDisplay(Math.round(easeOut(progress) * value));
        if (progress < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    };

    if (delay > 0) timer.current = setTimeout(start, delay);
    else start();

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [value, duration, delay]);

  return (
    <span className={className} suppressHydrationWarning>
      {display.toLocaleString()}
    </span>
  );
}
