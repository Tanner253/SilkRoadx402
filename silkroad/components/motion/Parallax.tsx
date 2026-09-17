'use client';

/**
 * Scroll-linked parallax. `scrub: true` ties progress directly to scroll
 * position, so with Lenis driving the ticker the movement inherits the same
 * eased glide as the page instead of feeling like a separate animation.
 *
 * Positive `speed` drifts the element up as you scroll past it; negative
 * drifts it down.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Total px of travel across the element's time on screen. */
  speed?: number;
}

export function Parallax({ children, className = '', speed = 70 }: ParallaxProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.to(node, {
        y: -speed,
        ease: 'none',
        scrollTrigger: {
          trigger: node,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, node);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={host} className={className}>
      {children}
    </div>
  );
}
