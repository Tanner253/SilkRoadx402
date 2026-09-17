/**
 * Penny — the OpenFund piggy bank. Pure inline SVG; the motion lives in
 * piggy.css (imported by the interactive <Piggy> wrapper, so this file stays
 * renderable in Node — scripts/generate-brand-media.tsx draws the banner and
 * avatar from this exact component).
 *
 * Drawn in a three-quarter view facing front-left, like a real ceramic bank:
 * the snout is a short cylinder whose flat face points at the viewer, so the
 * nostrils sit side by side; both eyes show; the ears are pointed and
 * cupped; the slot is a recessed groove following the curve of the back.
 *
 * Ceramic and brass colours are literal rather than theme vars — the mascot
 * has to look like itself wherever it sits.
 *
 * Poses:
 *  - idle:      bobbing, blinking, ear twitch, tail wag
 *  - sleep:     closed eyes, slow breathing, snore bubble, drifting zZz
 *  - happy:     ^‿^ eyes, open smile, sparkles — a donation landed
 *  - receiving: a coin drops through the slot on a loop, body squashes on impact
 */

import { useId } from 'react';

export type PiggyPose = 'idle' | 'sleep' | 'happy' | 'receiving';

interface PiggyBankProps {
  pose?: PiggyPose;
  /** Width in px; height scales automatically. */
  size?: number;
  className?: string;
  /** Disable the ambient motion classes (static renders, parent-driven motion). */
  still?: boolean;
  /** Hide the soft ground shadow. */
  noShadow?: boolean;
}

/** Plump egg-shaped body. The head is part of it — ceramic banks have no neck. */
const BODY_PATH =
  'M92,236 C92,168 152,120 238,120 C324,120 388,168 388,234 C388,294 330,334 240,334 C148,334 92,302 92,236 Z';

/** Where the slot sits along the top of the back. */
const SLOT_PATH = 'M262,158 Q296,149 332,154';

const INK = '#241C18';

export function PiggyBank({
  pose = 'idle',
  size = 320,
  className = '',
  still = false,
  noShadow = false,
}: PiggyBankProps) {
  const sleeping = pose === 'sleep';
  const happy = pose === 'happy';
  const receiving = pose === 'receiving';
  const anim = (name: string) => (still ? undefined : name);

  // Unique ids per instance — duplicate SVG ids break fills when one copy hides.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = `pg-body-${uid}`;
  const snout = `pg-snout-${uid}`;
  const brass = `pg-brass-${uid}`;
  const blush = `pg-blush-${uid}`;
  const clip = `pg-clip-${uid}`;
  const coinClip = `pg-coinclip-${uid}`;
  const soft = `pg-soft-${uid}`;
  const sheen = `pg-sheen-${uid}`;

  return (
    <svg
      viewBox="0 0 440 400"
      width={size}
      height={(size * 400) / 440}
      className={className}
      role="img"
      aria-label={
        sleeping
          ? 'Penny the piggy bank, fast asleep'
          : receiving
            ? 'Penny the piggy bank, taking a coin'
            : 'Penny the piggy bank'
      }
    >
      <defs>
        {/* One light field for every part; key light upper-left. */}
        <radialGradient id={body} gradientUnits="userSpaceOnUse" cx="176" cy="150" r="300">
          <stop offset="0%" stopColor="#F8E0D7" />
          <stop offset="38%" stopColor="#F1C9BC" />
          <stop offset="72%" stopColor="#E3AFA0" />
          <stop offset="100%" stopColor="#CB9082" />
        </radialGradient>
        <radialGradient id={snout} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#F8DDD3" />
          <stop offset="100%" stopColor="#E7B5A7" />
        </radialGradient>
        <linearGradient id={brass} x1="18%" y1="6%" x2="82%" y2="94%">
          <stop offset="0%" stopColor="#E7BC65" />
          <stop offset="52%" stopColor="#C79A42" />
          <stop offset="100%" stopColor="#A87C31" />
        </linearGradient>
        <radialGradient id={blush}>
          <stop offset="0%" stopColor="#E3867A" stopOpacity=".5" />
          <stop offset="100%" stopColor="#E3867A" stopOpacity="0" />
        </radialGradient>
        <filter id={soft} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={sheen} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id={clip}>
          <path d={BODY_PATH} />
        </clipPath>
        {/* The coin is only visible above the slot line, so it reads as going in. */}
        <clipPath id={coinClip}>
          <path d="M0,0 H440 V152 Q296,146 0,160 Z" />
        </clipPath>
      </defs>

      {!noShadow ? (
        <ellipse cx="240" cy="352" rx="150" ry="17" fill="#5F4934" opacity=".22" filter={`url(#${soft})`} />
      ) : null}

      <g className={anim(sleeping ? 'piggy-breathe' : 'piggy-bob')}>
        <g className={receiving ? anim('piggy-impact') : undefined}>
          {/* far legs, in shadow behind the body */}
          <rect x="114" y="282" width="42" height="56" rx="20" fill="#C98E80" />
          <rect x="344" y="278" width="40" height="54" rx="19" fill="#C98E80" />

          {/* curly tail off the rump */}
          <path
            className={sleeping ? undefined : anim('piggy-tail')}
            d="M384,214 c18,-12 34,2 24,15 c-8,10 -21,3 -16,-7"
            fill="none"
            stroke="#DDA595"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* far ear — behind the head, darker */}
          <path d="M118,168 C112,144 112,124 120,106 C136,116 150,134 156,154 Z" fill="#D69C8E" />
          <path d="M125,160 C121,144 121,130 126,118 C136,127 144,140 148,152 Z" fill="#BF7C6F" opacity=".5" />

          {/* near ear — pointed, cupped, tip leaning forward */}
          <g className={sleeping ? undefined : anim('piggy-ear')}>
            <path d="M172,152 C168,118 178,92 196,74 C216,90 232,114 234,144 Z" fill="#EDBBAD" />
            <path d="M183,146 C181,122 188,104 197,92 C210,105 219,122 222,142 Z" fill="#D8907F" opacity=".7" />
            <path d="M180,120 C184,104 190,92 196,84" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".45" />
          </g>

          {/* near legs */}
          <rect x="164" y="290" width="50" height="58" rx="23" fill={`url(#${body})`} />
          <rect x="298" y="288" width="50" height="58" rx="23" fill={`url(#${body})`} />

          {/* body */}
          <path d={BODY_PATH} fill={`url(#${body})`} />

          {/* form shading, clipped to the silhouette */}
          <g clipPath={`url(#${clip})`}>
            <ellipse cx="250" cy="352" rx="170" ry="52" fill="#C0806F" opacity=".45" filter={`url(#${soft})`} />
            <ellipse cx="206" cy="146" rx="84" ry="22" fill="#FFFFFF" opacity=".55" filter={`url(#${sheen})`} transform="rotate(-10 206 146)" />
            <ellipse cx="364" cy="236" rx="18" ry="62" fill="#FFFFFF" opacity=".2" filter={`url(#${sheen})`} />
          </g>

          {/* coin slot: a recess in the top of the back — soft rim shadow,
              dark opening, and a lit lower lip where the glaze turns down */}
          <path d={SLOT_PATH} stroke="#C4897B" strokeWidth="17" strokeLinecap="round" fill="none" opacity=".45" />
          <path d={SLOT_PATH} stroke="#3A241D" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M266,164 Q296,156 328,160" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".7" />

          {/* cheeks */}
          <circle cx="170" cy="236" r="19" fill={`url(#${blush})`} />

          {/* snout: a short cylinder, flat face toward the viewer */}
          <ellipse cx="116" cy="252" rx="37" ry="33" fill="#DDA394" transform="rotate(-8 116 252)" />
          <ellipse cx="100" cy="254" rx="37" ry="33" fill={`url(#${snout})`} stroke="#D29A8B" strokeWidth="1.5" transform="rotate(-8 100 254)" />
          <ellipse cx="87" cy="256" rx="6.2" ry="10" fill="#9C6152" transform="rotate(-8 87 256)" />
          <ellipse cx="112" cy="252" rx="6.2" ry="10" fill="#9C6152" transform="rotate(-8 112 252)" />
          <ellipse cx="92" cy="237" rx="17" ry="6" fill="#FFFFFF" opacity=".5" filter={`url(#${sheen})`} />

          {/* eyes */}
          {sleeping ? (
            <g stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round">
              <path d="M88,200 q8,7 16,0" />
              <path d="M148,194 q10,8 20,0" />
            </g>
          ) : happy ? (
            <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round">
              <path d="M88,203 q8,-10 16,0" />
              <path d="M148,197 q10,-12 20,0" />
            </g>
          ) : (
            <g className={anim('piggy-eye')}>
              <ellipse cx="96" cy="199" rx="7.5" ry="9" fill={INK} />
              <circle cx="93.6" cy="195.6" r="2.6" fill="#FFFFFF" />
              <ellipse cx="158" cy="193" rx="9" ry="10.5" fill={INK} />
              <circle cx="155" cy="189" r="3.2" fill="#FFFFFF" />
            </g>
          )}

          {/* mouth, tucked under the snout */}
          {happy ? (
            <g>
              <path d="M104,290 Q120,312 138,289 Q121,294 104,290 Z" fill="#5A2E27" />
              <path d="M112,300 Q121,309 131,299 Q121,297 112,300 Z" fill="#E88C84" />
            </g>
          ) : sleeping ? (
            <path d="M110,294 q8,4 15,0" stroke={INK} strokeWidth="3.4" fill="none" strokeLinecap="round" opacity=".6" />
          ) : (
            <path d="M106,293 q11,8 24,0" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" opacity=".7" />
          )}
        </g>
      </g>

      {/* snore bubble at the snout */}
      {sleeping ? (
        <g className={anim('piggy-snore')}>
          <ellipse cx="54" cy="274" rx="15" ry="13" fill="#FFFFFF" fillOpacity=".3" stroke="#FFFFFF" strokeOpacity=".9" strokeWidth="2" />
          <ellipse cx="49" cy="269" rx="4" ry="2.6" fill="#FFFFFF" opacity=".9" transform="rotate(-30 49 269)" />
        </g>
      ) : null}

      {/* drifting zZz */}
      {sleeping ? (
        <g fill="#8A8F7E" fontFamily="Georgia, serif" fontWeight="700">
          <text className={anim('piggy-zzz piggy-zzz-1')} x="246" y="104" fontSize="26">z</text>
          <text className={anim('piggy-zzz piggy-zzz-2')} x="266" y="84" fontSize="20">z</text>
          <text className={anim('piggy-zzz piggy-zzz-3')} x="282" y="68" fontSize="15">z</text>
        </g>
      ) : null}

      {/* the coin, dropping through the slot */}
      {receiving ? (
        <g clipPath={`url(#${coinClip})`}>
          <g className={anim('piggy-coin')}>
            <g transform="translate(297 130)">
              <ellipse cx="0" cy="2.5" rx="23" ry="23" fill="#916A27" />
              <ellipse cx="0" cy="0" rx="23" ry="23" fill={`url(#${brass})`} />
              <circle cx="0" cy="0" r="16" fill="none" stroke="#E7BC65" strokeWidth="2.4" opacity=".85" />
              <ellipse cx="-7" cy="-7" rx="7" ry="4.5" fill="#FFF3D8" opacity=".55" transform="rotate(-32)" />
            </g>
          </g>
        </g>
      ) : null}

      {/* sparkles for a landed donation */}
      {happy ? (
        <g fill="#C79A42">
          <path className={anim('piggy-sparkle')} d="M356 104 l4.4 11.6 11.6 4.4 -11.6 4.4 -4.4 11.6 -4.4 -11.6 -11.6 -4.4 11.6 -4.4 Z" />
          <path className={anim('piggy-sparkle piggy-sparkle-2')} d="M60 128 l3.2 8.4 8.4 3.2 -8.4 3.2 -3.2 8.4 -3.2 -8.4 -8.4 -3.2 8.4 -3.2 Z" />
        </g>
      ) : null}
    </svg>
  );
}
