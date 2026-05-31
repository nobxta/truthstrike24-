"use client";

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Animation =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "blur-in"
  | "slide-up"
  | "flip-up";

interface Props {
  children: ReactNode;
  animation?: Animation;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
}

const TRANSFORMS: Record<Animation, { from: string; to: string }> = {
  "fade-up": {
    from: "translate3d(0,60px,0) scale(0.97)",
    to: "translate3d(0,0,0) scale(1)",
  },
  "fade-down": {
    from: "translate3d(0,-60px,0) scale(0.97)",
    to: "translate3d(0,0,0) scale(1)",
  },
  "fade-left": {
    from: "translate3d(-80px,0,0)",
    to: "translate3d(0,0,0)",
  },
  "fade-right": {
    from: "translate3d(80px,0,0)",
    to: "translate3d(0,0,0)",
  },
  "zoom-in": {
    from: "scale(0.8)",
    to: "scale(1)",
  },
  "blur-in": {
    from: "scale(0.95)",
    to: "scale(1)",
  },
  "slide-up": {
    from: "translate3d(0,100px,0)",
    to: "translate3d(0,0,0)",
  },
  "flip-up": {
    from: "perspective(800px) rotateX(12deg) translate3d(0,40px,0)",
    to: "perspective(800px) rotateX(0) translate3d(0,0,0)",
  },
};

export default function ScrollAnimate({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 800,
  threshold = 0.15,
  once = true,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const t = TRANSFORMS[animation];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? t.to : t.from,
        filter: animation === "blur-in" && !visible ? "blur(10px)" : "blur(0)",
        transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({
  children,
  className = "",
  staggerMs = 120,
  animation = "fade-up" as Animation,
  duration = 700,
}: {
  children: ReactNode[];
  className?: string;
  staggerMs?: number;
  animation?: Animation;
  duration?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollAnimate
          key={i}
          animation={animation}
          delay={i * staggerMs}
          duration={duration}
        >
          {child}
        </ScrollAnimate>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   TypewriterText – types out letter-by-letter on scroll
   ─────────────────────────────────────────────────────────── */

interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
}

export function TypewriterText({
  text,
  className = "",
  speed = 50,
  delay = 0,
  cursor = true,
}: TypewriterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [started, text, speed, delay]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      {cursor && !done && (
        <span
          style={{
            animation: "typewriter-blink 1060ms steps(2, start) infinite",
          }}
        >
          |
        </span>
      )}
      <style>{`
        @keyframes typewriter-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}

/* ───────────────────────────────────────────────────────────
   CountUp – counts from 0 to target number on scroll
   ─────────────────────────────────────────────────────────── */

interface CountUpProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  decimals?: number;
  className?: string;
  separator?: string;
}

function formatNumber(n: number, decimals: number, separator: string): string {
  const fixed = n.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return decPart !== undefined ? `${withSep}.${decPart}` : withSep;
}

export function CountUp({
  end,
  prefix = "",
  suffix = "",
  duration = 2000,
  delay = 0,
  decimals = 0,
  className = "",
  separator = ",",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const timeout = setTimeout(() => {
      let startTime: number | null = null;
      let rafId: number;

      const easeOutExpo = (t: number) => 1 - Math.pow(2, -10 * t);

      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easedValue = easeOutExpo(t) * end;

        setValue(easedValue);

        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setValue(end);
        }
      };

      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    }, delay);

    return () => clearTimeout(timeout);
  }, [started, end, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(value, decimals, separator)}
      {suffix}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────
   StaggerGrid – reveals grid children with staggered delays
   ─────────────────────────────────────────────────────────── */

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
  animation?: Animation;
  columns?: 2 | 3 | 4;
}

const COL_CLASSES: Record<2 | 3 | 4, string> = {
  2: "grid grid-cols-1 lg:grid-cols-2",
  3: "grid grid-cols-1 lg:grid-cols-3",
  4: "grid grid-cols-1 lg:grid-cols-4",
};

export function StaggerGrid({
  children,
  className = "",
  staggerMs = 150,
  animation = "fade-up",
  columns = 4,
}: StaggerGridProps) {
  const items = React.Children.toArray(children);

  return (
    <div className={`${COL_CLASSES[columns]} ${className}`}>
      {items.map((child, i) => (
        <ScrollAnimate key={i} animation={animation} delay={i * staggerMs}>
          {child}
        </ScrollAnimate>
      ))}
    </div>
  );
}
