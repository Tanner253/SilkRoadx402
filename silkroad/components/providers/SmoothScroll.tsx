'use client';

/**
 * Lenis smooth scroll, driven off GSAP's ticker.
 *
 * Running Lenis from gsap.ticker (rather than its own rAF loop) means scroll
 * position and every ScrollTrigger update happen in the same frame, so
 * scroll-linked animations can't tear or lag a frame behind the page.
 *
 * Tuning matches the reference feel: a 1.1s exponential-out glide. lagSmoothing
 * is disabled so a stalled tab doesn't make GSAP swallow the catch-up frames.
 *
 * Disabled outright under prefers-reduced-motion — hijacking scroll is exactly
 * what that setting asks us not to do.
 */

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      orientation: 'vertical',
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', onScroll);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
