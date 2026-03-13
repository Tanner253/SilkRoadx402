'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Coin slot sits at the top of the pig body in world space
const SLOT = new THREE.Vector3(0, 1.38, 0);

// Coin start positions spread around in 3D space
const COIN_ORIGINS: THREE.Vector3[] = [
  new THREE.Vector3(-5.5,  2.5, -2.5),
  new THREE.Vector3( 5.5,  2.5, -2.0),
  new THREE.Vector3( 5.0, -2.5,  3.5),
  new THREE.Vector3(-4.5, -2.0,  3.5),
  new THREE.Vector3( 0.5,  5.5, -3.5),
  new THREE.Vector3( 3.5,  4.5,  3.0),
];

// ─── FLYING COIN ─────────────────────────────────────────────────────────────
function FlyingCoin({ origin, phaseOffset }: { origin: THREE.Vector3; phaseOffset: number }) {
  const ref = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const ctrl = origin.clone().lerp(SLOT, 0.5);
    ctrl.y = Math.max(origin.y, SLOT.y) + 2.5;
    return new THREE.QuadraticBezierCurve3(origin.clone(), ctrl, SLOT.clone());
  }, [origin]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const PERIOD = 3.2;
    const raw = ((clock.getElapsedTime() + phaseOffset) % PERIOD) / PERIOD;
    const t = raw < 0 ? raw + 1 : raw;

    if (t > 0.95) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;

    // ease-in acceleration toward slot
    const eased = t * t * (3 - 2 * t);
    ref.current.position.copy(curve.getPoint(eased));

    // spin as it travels
    ref.current.rotation.y += 0.12;
    ref.current.rotation.x += 0.05;

    // shrink when near slot
    const s = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.13) : 1;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.2, 0.2, 0.045, 28]} />
      <meshStandardMaterial
        color="#FBBF24"
        emissive="#F97316"
        emissiveIntensity={1.2}
        metalness={0.95}
        roughness={0.08}
      />
    </mesh>
  );
}

// ─── PIGGY BANK ──────────────────────────────────────────────────────────────
function PiggyBank() {
  const groupRef = useRef<THREE.Group>(null);

  const tailGeo = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.3,  0.1,  0),
      new THREE.Vector3(-1.9,  0.7,  0.4),
      new THREE.Vector3(-1.65, 0.15, 0.6),
    );
    return new THREE.TubeGeometry(curve, 22, 0.065, 10, false);
  }, []);
  useEffect(() => () => tailGeo.dispose(), [tailGeo]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.75) * 0.1;
    // -Math.PI/2 rotates pig's head from +X axis to +Z axis (toward camera)
    groupRef.current.rotation.y = -Math.PI / 2 + Math.sin(t * 0.45) * 0.06;
  });

  return (
    <group ref={groupRef}>

      {/* ── BODY ── */}
      <mesh scale={[1, 0.86, 1]}>
        <sphereGeometry args={[1.32, 64, 64]} />
        <meshStandardMaterial color="#ffb3c6" metalness={0.08} roughness={0.55} />
      </mesh>

      {/* ── HEAD ── */}
      <mesh position={[1.52, 0.34, 0]}>
        <sphereGeometry args={[0.78, 56, 56]} />
        <meshStandardMaterial color="#ffb3c6" metalness={0.08} roughness={0.55} />
      </mesh>

      {/* ── SNOUT ── */}
      <mesh position={[2.18, 0.12, 0]} scale={[0.72, 0.6, 1]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#ff85a1" metalness={0.05} roughness={0.65} />
      </mesh>

      {/* Nostrils */}
      {[0.12, -0.12].map((z, i) => (
        <mesh key={i} position={[2.49, 0.0, z]}>
          <sphereGeometry args={[0.07, 14, 14]} />
          <meshStandardMaterial color="#c0385a" roughness={0.9} />
        </mesh>
      ))}

      {/* ── EYES (both sides, clearly visible facing camera) ── */}
      {[0.42, -0.42].map((z, i) => (
        <group key={i} position={[1.72, 0.60, z]}>
          {/* White sclera */}
          <mesh>
            <sphereGeometry args={[0.13, 22, 22]} />
            <meshStandardMaterial color="white" roughness={0.05} metalness={0.05} />
          </mesh>
          {/* Dark pupil */}
          <mesh position={[0.08, 0, 0]}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial color="#0d0008" roughness={0.2} />
          </mesh>
          {/* Gleam */}
          <mesh position={[0.12, 0.04, 0.04]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}

      {/* ── EARS ── */}
      {[0.52, -0.52].map((z, i) => (
        <group key={i} position={[1.45, 1.06, z]}>
          {/* Outer ear */}
          <mesh scale={[0.65, 1.05, 0.55]}>
            <sphereGeometry args={[0.28, 22, 22]} />
            <meshStandardMaterial color="#ff85a1" metalness={0.05} roughness={0.55} />
          </mesh>
          {/* Inner ear (lighter pink) */}
          <mesh position={[0.06, 0, 0]} scale={[0.42, 0.7, 0.32]}>
            <sphereGeometry args={[0.28, 18, 18]} />
            <meshStandardMaterial color="#ffd6e0" roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* ── LEGS (4 stubby cylinders) ── */}
      {([
        [ 0.55, -0.38],
        [ 0.55,  0.38],
        [-0.55, -0.38],
        [-0.55,  0.38],
      ] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, -1.2, z]}>
          <cylinderGeometry args={[0.19, 0.16, 0.52, 20]} />
          <meshStandardMaterial color="#ff85a1" metalness={0.05} roughness={0.58} />
        </mesh>
      ))}

      {/* ── TAIL ── */}
      <mesh geometry={tailGeo}>
        <meshStandardMaterial color="#ff85a1" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* ── COIN SLOT ── */}
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.62, 0.09, 0.115]} />
        <meshStandardMaterial color="#3a0010" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <boxGeometry args={[0.64, 0.04, 0.13]} />
        <meshStandardMaterial
          color="#c0385a"
          emissive="#ff85a1"
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ─── SCENE ROOT (mouse parallax wrapper) ─────────────────────────────────────
function SceneRoot() {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();
  const smooth = useRef(new THREE.Vector2(0, 0));

  useFrame(() => {
    smooth.current.lerp(mouse, 0.038);
    if (!groupRef.current) return;
    groupRef.current.rotation.y = smooth.current.x * 0.28;
    groupRef.current.rotation.x = -smooth.current.y * 0.14;
  });

  return (
    <group ref={groupRef}>
      {/* Sun key light */}
      <directionalLight position={[5, 6, 4]} intensity={2.4} color="#fff8ee" />
      {/* Cool fill from left */}
      <pointLight position={[-5, 3, -3]} intensity={0.8} color="#5566ff" />
      {/* Warm bounce under */}
      <pointLight position={[0, -3, 4]} intensity={0.5} color="#ff8822" />
      {/* Ambient */}
      <ambientLight intensity={0.22} />

      <PiggyBank />

      {COIN_ORIGINS.map((origin, i) => (
        <FlyingCoin key={i} origin={origin} phaseOffset={i * (3.2 / COIN_ORIGINS.length)} />
      ))}
    </group>
  );
}

// ─── DONATION FEED (HTML overlay) ────────────────────────────────────────────
const MOCK_DONATIONS = [
  { id: 1, name: 'Alex K.',    amount: '0.08 SOL',  campaign: 'Medical Fund for Jake',    av: 'AK' },
  { id: 2, name: 'Sarah M.',   amount: '0.03 SOL',  campaign: 'Community Garden Project', av: 'SM' },
  { id: 3, name: 'Jordan T.',  amount: '12.5 SOL',  campaign: 'Hurricane Relief Fund',    av: 'JT' },
  { id: 4, name: 'Emma R.',    amount: '0.05 SOL',  campaign: 'Youth Sports Program',     av: 'ER' },
  { id: 5, name: 'Mike P.',    amount: '0.12 SOL',  campaign: 'Local Animal Shelter',     av: 'MP' },
  { id: 6, name: 'Chris L.',   amount: '0.02 SOL',  campaign: 'Music Scholarship Fund',   av: 'CL' },
  { id: 7, name: 'Priya N.',   amount: '47.0 SOL',  campaign: 'Clean Water Initiative',   av: 'PN' },
  { id: 8, name: 'Sam W.',     amount: '0.07 SOL',  campaign: "Children's Library Build", av: 'SW' },
  { id: 9, name: 'Lena B.',    amount: '0.04 SOL',  campaign: 'Refugee Housing Fund',     av: 'LB' },
  { id: 10, name: 'Omar H.',   amount: '0.19 SOL',  campaign: 'Community Clinic Build',   av: 'OH' },
  { id: 11, name: 'Kai S.',    amount: '3.3 SOL',   campaign: 'Wildlife Rescue Fund',     av: 'KS' },
  { id: 12, name: 'Tara M.',   amount: '0.01 SOL',  campaign: 'Art for Kids Program',     av: 'TM' },
];

function DonationFeed() {
  const [feed, setFeed] = useState(MOCK_DONATIONS.slice(0, 4));
  const [entering, setEntering] = useState(0);
  const idx = useRef(4);

  useEffect(() => {
    const iv = setInterval(() => {
      const next = MOCK_DONATIONS[idx.current % MOCK_DONATIONS.length];
      idx.current++;
      setFeed(prev => [next, ...prev.slice(0, 3)]);
      setEntering(next.id);
      setTimeout(() => setEntering(0), 500);
    }, 5500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      className="absolute hidden sm:flex flex-col gap-2 pointer-events-none"
      style={{ right: 20, bottom: 24, width: 284 }}
    >
      {feed.map((d, i) => (
        <div
          key={d.id}
          className="flex items-center gap-3 rounded-xl border border-orange-900/35 bg-black/60 backdrop-blur-md px-3 py-2.5"
          style={{
            opacity: 1 - i * 0.2,
            transition: 'opacity 0.3s',
            animation: d.id === entering ? 'feedIn 0.45s ease-out both' : 'none',
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black"
            style={{
              background: i % 2 === 0
                ? '#F97316'
                : '#FBBF24',
            }}
          >
            {d.av}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white/85">{d.name}</span>
              <span className="text-[#FBBF24] text-[11px] leading-none">★★★★★</span>
            </div>
            <p className="truncate text-[10px] text-white/35 mt-0.5">{d.campaign}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-black text-[#FBBF24]">{d.amount}</div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes feedIn {
          from { opacity:0; transform:translateY(-12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── RESPONSIVE WRAPPER (skip heavy 3D on mobile) ────────────────────────────
function ResponsivePig() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(window.innerWidth >= 640);
  }, []);
  if (!show) return null;
  return <SceneRoot />;
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export function PiggyScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.6, 7.5], fov: 50 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        {/* Scene background — matches page bg */}
        <color attach="background" args={['#020308']} />

        {/* Galaxy starfield */}
        <Stars radius={140} depth={80} count={9000} factor={4} saturation={0.05} fade speed={0.6} />

        {/* Hide pig on mobile — too heavy, canvas shows stars only */}
        <ResponsivePig />

        <EffectComposer>
          <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.82} intensity={1.7} />
        </EffectComposer>
      </Canvas>

      {/* HTML overlay: live donation feed */}
      <DonationFeed />
    </div>
  );
}
