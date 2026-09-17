'use client';

/**
 * Interactive Penny — tap her and she squeaks and wiggles. A sleeping pig
 * wakes up, grins, then dozes off again. Every fifth tap is a bigger
 * reaction; ten taps in a row tips a coin in.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PiggyBank, type PiggyPose } from './PiggyBank';
import { playCoin, playOink, playSnore } from '@/lib/sound';
import './piggy.css';

interface PiggyProps {
  pose?: PiggyPose;
  size?: number;
  className?: string;
  /** Disable tap interaction (decorative placements). */
  interactive?: boolean;
  /**
   * Drift back to `pose` after this many ms of no taps. Lets the hero settle
   * back to sleep once you stop poking it.
   */
  restMs?: number;
}

export function Piggy({
  pose = 'idle',
  size = 320,
  className = '',
  interactive = true,
  restMs = 3600,
}: PiggyProps) {
  const reduceMotion = useReducedMotion();
  const [reaction, setReaction] = useState<'none' | 'wiggle' | 'hop'>('none');
  const [tempPose, setTempPose] = useState<PiggyPose | null>(null);
  const taps = useRef(0);
  const restTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (restTimer.current) clearTimeout(restTimer.current);
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    [],
  );

  const handleTap = useCallback(() => {
    if (!interactive) return;

    taps.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      taps.current = 0;
    }, 2500);

    if (taps.current >= 10) {
      taps.current = 0;
      playCoin();
      setTempPose('receiving');
      setReaction('hop');
    } else if (taps.current % 5 === 0) {
      playCoin();
      setTempPose('happy');
      setReaction('hop');
    } else {
      playOink();
      setTempPose('happy');
      setReaction('wiggle');
    }

    // Settle back to the resting pose once the poking stops.
    if (restTimer.current) clearTimeout(restTimer.current);
    restTimer.current = setTimeout(() => {
      if (pose === 'sleep') playSnore();
      setTempPose(null);
    }, restMs);
  }, [interactive, pose, restMs]);

  const animate =
    reduceMotion || reaction === 'none'
      ? {}
      : reaction === 'hop'
        ? { y: [0, -18, 0], scale: [1, 1.06, 1] }
        : { rotate: [0, -5, 5, -3, 0], scale: [1, 1.04, 1] };

  return (
    <motion.div
      className={`inline-block select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
      whileTap={interactive && !reduceMotion ? { scale: 0.96 } : undefined}
      animate={animate}
      transition={{ duration: reaction === 'hop' ? 0.62 : 0.45, ease: 'easeInOut' }}
      onAnimationComplete={() => setReaction('none')}
      onTap={handleTap}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleTap();
              }
            }
          : undefined
      }
      aria-label={interactive ? 'Penny the piggy bank — tap her' : undefined}
    >
      <PiggyBank pose={tempPose ?? pose} size={size} />
    </motion.div>
  );
}
