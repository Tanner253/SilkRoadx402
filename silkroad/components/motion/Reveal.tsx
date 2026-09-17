'use client';

/**
 * Scroll-triggered reveal.
 *
 * Children rise and fade in as they enter the viewport, once. With `stagger`,
 * the element's direct children are revealed in sequence instead of the
 * wrapper as a whole — which is what you want for a list of cards or rows.
 *
 * The initial hidden state is set from JS rather than CSS so that a visitor
 * with JS disabled (or a failed hydration) still sees the content.
 */

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Render as something other than a div. */
  as?: ElementType;
  /** Seconds to wait once the trigger fires. */
  delay?: number;
  /** Distance in px to travel upward. */
  y?: number;
  /** Reveal direct children in sequence, this many seconds apart. */
  stagger?: number;
}

export function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  delay = 0,
  y = 26,
  stagger,
}: RevealProps) {
  const host = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = stagger ? Array.from(node.children) : [node];
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.95,
          delay,
          stagger: stagger ?? 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 88%',
            once: true,
          },
        },
      );
    }, node);

    return () => ctx.revert();
  }, [delay, y, stagger]);

  // `as` is deliberately open, so narrow it to the shape we actually pass.
  const Component = Tag as React.ComponentType<{
    ref?: React.Ref<HTMLElement>;
    className?: string;
    children?: ReactNode;
  }>;

  return (
    <Component ref={host} className={className}>
      {children}
    </Component>
  );
}
