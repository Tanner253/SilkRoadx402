'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── SHARED VERTEX SHADER ─────────────────────────────────────────────────────
const V_SHARED = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal  = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

// ─── EARTH FRAGMENT SHADER ────────────────────────────────────────────────────
const EARTH_FRAG = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float diff    = max(dot(vNormal, normalize(uSun)), 0.0);
    float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 3.5);

    vec3 dayDeep  = vec3(0.02, 0.08, 0.32);
    vec3 dayShelf = vec3(0.05, 0.20, 0.50);
    vec3 nightCol = vec3(0.008, 0.014, 0.048);
    // warm city-light tinge on dark side
    vec3 cityGlow = vec3(0.06, 0.03, 0.01) * (1.0 - diff) * 0.6;

    vec3 base = mix(nightCol + cityGlow, mix(dayDeep, dayShelf, diff), diff * 0.92 + 0.06);

    // Atmospheric rim — cyan-blue
    vec3 atmos = vec3(0.15, 0.50, 1.0) * fresnel * 1.6;

    // Specular highlight (sun glint)
    vec3 halfV = normalize(normalize(uSun) + vViewDir);
    float spec = pow(max(dot(vNormal, halfV), 0.0), 55.0) * diff * 0.4;

    gl_FragColor = vec4(base + atmos + spec, 1.0);
  }
`;

// ─── ATMOSPHERE FRAGMENT SHADER ───────────────────────────────────────────────
const ATMOS_FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float rim = 1.0 - max(dot(vViewDir, vNormal), 0.0);
    rim = pow(rim, 2.0);
    vec3 col = mix(vec3(0.1, 0.38, 0.95), vec3(0.45, 0.78, 1.0), rim);
    gl_FragColor = vec4(col, rim * 0.7);
  }
`;

// ─── EARTH ────────────────────────────────────────────────────────────────────
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  const earthMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: V_SHARED,
    fragmentShader: EARTH_FRAG,
    uniforms: { uSun: { value: new THREE.Vector3(3, 2, 2).normalize() } },
  }), []);

  const atmosMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: V_SHARED,
    fragmentShader: ATMOS_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  }), []);

  useEffect(() => () => { earthMat.dispose(); atmosMat.dispose(); }, [earthMat, atmosMat]);

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 0.07;
  });

  return (
    <group>
      <mesh ref={meshRef} material={earthMat}>
        <sphereGeometry args={[2, 64, 64]} />
      </mesh>
      {/* Close corona */}
      <mesh material={atmosMat} scale={1.07}>
        <sphereGeometry args={[2, 48, 48]} />
      </mesh>
      {/* Wide halo */}
      <mesh material={atmosMat} scale={1.28}>
        <sphereGeometry args={[2, 32, 32]} />
      </mesh>
    </group>
  );
}

// ─── ORBITAL RINGS ────────────────────────────────────────────────────────────
function OrbitalRings() {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (r1.current) r1.current.rotation.z =  t * 0.09;
    if (r2.current) r2.current.rotation.z = -t * 0.055;
    if (r3.current) r3.current.rotation.z =  t * 0.065;
  });

  return (
    <>
      {/* Equatorial — gold */}
      <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.1, 0.013, 16, 256]} />
        <meshStandardMaterial color="#FBBF24" emissive="#F97316" emissiveIntensity={4} />
      </mesh>

      {/* Tilted — orange */}
      <mesh ref={r2} rotation={[Math.PI / 2 - 0.88, 0.25, 0]}>
        <torusGeometry args={[4.0, 0.008, 12, 200]} />
        <meshStandardMaterial color="#F97316" emissive="#c2410c" emissiveIntensity={3} transparent opacity={0.75} />
      </mesh>

      {/* Outer — dim blue-white */}
      <mesh ref={r3} rotation={[Math.PI / 2 + 0.5, -0.4, 0.15]}>
        <torusGeometry args={[5.0, 0.005, 8, 256]} />
        <meshStandardMaterial color="#aac8ff" emissive="#6699ff" emissiveIntensity={2} transparent opacity={0.4} />
      </mesh>
    </>
  );
}

// ─── SATELLITE ────────────────────────────────────────────────────────────────
function Satellite({ r, spd, inc, phase, sz = 1 }: {
  r: number; spd: number; inc: number; phase: number; sz?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * spd + phase;
    const x =  Math.cos(t) * r;
    const y =  Math.sin(t) * Math.sin(inc) * r;
    const z =  Math.sin(t) * Math.cos(inc) * r;
    if (!groupRef.current) return;
    groupRef.current.position.set(x, y, z);
    groupRef.current.lookAt(0, 0, 0);
    groupRef.current.rotateX(Math.PI / 2);
  });

  const s = sz;
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.14 * s, 0.09 * s, 0.09 * s]} />
        <meshStandardMaterial color="#b4bece" metalness={0.92} roughness={0.12} />
      </mesh>
      {/* Solar panels */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0.24 * s * side, 0, 0]}>
          <boxGeometry args={[0.21 * s, 0.001, 0.14 * s]} />
          <meshStandardMaterial
            color="#152565"
            metalness={0.6}
            roughness={0.4}
            emissive="#0a1845"
            emissiveIntensity={1}
          />
        </mesh>
      ))}
      {/* Antenna */}
      <mesh position={[0, 0.1 * s, 0]}>
        <cylinderGeometry args={[0.004 * s, 0.004 * s, 0.1 * s, 6]} />
        <meshStandardMaterial color="#d8e0f0" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Status beacon */}
      <mesh position={[0.08 * s, 0.07 * s, 0]}>
        <sphereGeometry args={[0.014 * s, 8, 8]} />
        <meshStandardMaterial emissive="#FBBF24" emissiveIntensity={8} color="#FBBF24" />
      </mesh>
    </group>
  );
}

// ─── DONATION ARC ─────────────────────────────────────────────────────────────
function DonationArc({ from, to, color, spd }: {
  from: THREE.Vector3; to: THREE.Vector3; color: string; spd: number;
}) {
  const dotRef = useRef<THREE.Mesh>(null);

  const { curve, geo } = useMemo(() => {
    const a = from.clone().normalize().multiplyScalar(2.06);
    const b = to.clone().normalize().multiplyScalar(2.06);
    const mid = a.clone().add(b).normalize().multiplyScalar(3.1);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 64, 0.007, 6, false);
    return { curve, geo };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    if (!dotRef.current) return;
    const t = (clock.getElapsedTime() * spd) % 1;
    dotRef.current.position.copy(curve.getPoint(t));
  });

  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={12} color={color} />
      </mesh>
    </group>
  );
}

// ─── ARC DATA ─────────────────────────────────────────────────────────────────
const ARCS = [
  { from: new THREE.Vector3( 0.7,  0.5,  0.5), to: new THREE.Vector3(-0.5, -0.3,  0.8), color: '#F97316', spd: 0.18 },
  { from: new THREE.Vector3(-0.8,  0.4,  0.4), to: new THREE.Vector3( 0.9, -0.4,  0.2), color: '#FBBF24', spd: 0.14 },
  { from: new THREE.Vector3( 0.3, -0.9,  0.3), to: new THREE.Vector3(-0.7,  0.5, -0.5), color: '#F97316', spd: 0.22 },
  { from: new THREE.Vector3(-0.2,  0.6, -0.8), to: new THREE.Vector3( 0.8, -0.5,  0.3), color: '#FBBF24', spd: 0.16 },
  { from: new THREE.Vector3( 0.9,  0.1, -0.4), to: new THREE.Vector3(-0.5, -0.7,  0.5), color: '#F97316', spd: 0.20 },
  { from: new THREE.Vector3(-0.4,  0.8,  0.4), to: new THREE.Vector3( 0.6, -0.6, -0.5), color: '#FBBF24', spd: 0.12 },
];

// ─── SCENE ROOT — wraps everything for mouse parallax ────────────────────────
function SceneRoot() {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();
  const smooth = useRef(new THREE.Vector2(0, 0));

  useFrame(() => {
    smooth.current.lerp(mouse, 0.035);
    if (!groupRef.current) return;
    groupRef.current.rotation.y =  smooth.current.x * 0.22;
    groupRef.current.rotation.x = -smooth.current.y * 0.11;
  });

  return (
    <group ref={groupRef}>
      {/* Sun key light */}
      <directionalLight position={[5, 3, 4]}  intensity={2.0}  color="#fff8f0" />
      <ambientLight intensity={0.09} />
      {/* Rim / fill from opposite side */}
      <pointLight position={[-7, -2, -5]} intensity={0.5} color="#3355ff" />

      <Earth />
      <OrbitalRings />

      <Satellite r={3.1}  spd={0.33} inc={ 0.50} phase={0.0}  sz={1.0} />
      <Satellite r={4.4}  spd={0.20} inc={ 1.15} phase={2.1}  sz={1.3} />
      <Satellite r={3.75} spd={0.46} inc={-0.72} phase={4.2}  sz={0.8} />

      {ARCS.map((a, i) => <DonationArc key={i} {...a} />)}
    </group>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.6, 7.8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Stars radius={130} depth={80} count={9000} factor={4} saturation={0.06} fade speed={0.7} />

        <SceneRoot />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.25}
            luminanceSmoothing={0.85}
            intensity={1.6}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
