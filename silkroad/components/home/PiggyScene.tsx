'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei';
import { Pause, Play, RotateCcw } from 'lucide-react';
import * as THREE from 'three';

const PERIOD = 3.4;
const ease = (v: number) => v * v * (3 - 2 * v);

function Coin({ flat = false }: { flat?: boolean }) {
  return (
    <group rotation={[flat ? 0 : Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[.245, .245, .055, 64]} />
        <meshStandardMaterial color="#c79a42" metalness={.88} roughness={.24} />
      </mesh>
      {[-1, 1].map(side => (
        <group key={side} position={[0, side * .029, 0]} rotation={[side * Math.PI / 2, 0, 0]}>
          <mesh><torusGeometry args={[.208, .011, 8, 64]} /><meshStandardMaterial color="#e7bc65" metalness={.85} roughness={.22} /></mesh>
          <mesh scale={[.72,1,.14]} position={[0,0,.006]}><octahedronGeometry args={[.135,0]} /><meshStandardMaterial color="#e7bc65" metalness={.85} roughness={.25} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Bank({ playing, replay }: { playing: boolean; replay: number }) {
  const { nodes } = useGLTF('/models/openfund-pig.glb');
  const root = useRef<THREE.Group>(null);
  const bank = useRef<THREE.Group>(null);
  const coin = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const intro = useRef(0);
  const tail = useMemo(() => {
    const points = Array.from({ length: 65 }, (_, i) => {
      const t = i / 64, a = t * Math.PI * 2.1;
      return new THREE.Vector3(1.36 + t * .53, .12 + Math.sin(a) * .18, Math.cos(a) * .18);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, .06, 12, false);
  }, []);
  useEffect(() => () => tail.dispose(), [tail]);
  useEffect(() => { elapsed.current = 0; intro.current = 0; }, [replay]);
  useFrame(({ pointer }, delta) => {
    const dt = Math.min(delta, .05);
    if (playing) { elapsed.current += dt; intro.current = Math.min(intro.current + dt / 1.35, 1); }
    else intro.current = 1;
    const phase = (elapsed.current % PERIOD) / PERIOD;
    // Coin and bank share a coordinate system, so the slot stays aligned during parallax.
    if (root.current) {
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, playing ? pointer.x * .10 : 0, 3, dt);
      root.current.position.y = playing ? (1 - ease(intro.current)) * -.18 : 0;
    }
    if (bank.current) {
      const impact = phase > .85 ? Math.sin((phase - .85) / .15 * Math.PI) * .022 : 0;
      bank.current.scale.y = 1 - impact;
      bank.current.position.y = -impact * 1.45;
    }
    // Update transforms directly: animation never re-renders React each frame.
    if (coin.current) {
      const approach = ease(Math.min(phase / .53, 1));
      coin.current.visible = phase < .89;
      coin.current.position.set(THREE.MathUtils.lerp(2.25, .05, approach), phase < .53 ? 2.6 + Math.sin(approach * Math.PI) * .3 : 2.6 - Math.pow((phase - .53) / .36, 2) * 2.05, 0);
      coin.current.rotation.set(0, (1 - approach) * Math.PI * 2, (1 - approach) * .4);
    }
  });
  // Keep geometry/material identity stable between control updates.
  const ceramic = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e3afa0', roughness: .22, metalness: 0, clearcoat: 1, clearcoatRoughness: .13, ior: 1.48 }), []);
  useEffect(() => () => ceramic.dispose(), [ceramic]);
  return (
    <group ref={root}>
      <group ref={bank}>
        <mesh geometry={(nodes.CeramicPig as THREE.Mesh).geometry} material={ceramic} castShadow receiveShadow />
        <mesh geometry={tail} material={ceramic} castShadow />
        {[-1, 1].map(side => (
          <mesh key={side} position={[-1.56, .53, side * .577]} scale={[.075, .085, .048]} rotation={[0, side * -.5, 0]}>
            <sphereGeometry args={[1, 24, 24]} /><meshPhysicalMaterial color="#241c18" roughness={.16} clearcoat={1} />
          </mesh>
        ))}
        <mesh position={[.05, .85, 0]}><boxGeometry args={[.8,.025,.15]} /><meshStandardMaterial color="#4b3028" roughness={1} /></mesh>
      </group>
      <group ref={coin}><Coin /></group>
      {[0,1,2].map(i => <group key={i} position={[-1.75 + i*.015, -1.365 + i*.059, 1.02]} rotation={[0, i*.35, 0]}><Coin flat /></group>)}
    </group>
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="piggy-fallback">The 3D preview is unavailable on this device. You can still explore and support campaigns.</div>;
    return this.props.children;
  }
}

export function PiggyScene() {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [replay, setReplay] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    if (host.current) observer.observe(host.current);
    const visibility = () => setVisible(!document.hidden && !!host.current && host.current.getBoundingClientRect().bottom > 0);
    document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', update); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const playing = !paused && !reduced && visible;
  return (
    <div className="piggy-stage" ref={host}>
      <div className="piggy-canvas" role="img" aria-label="Animated glazed ceramic piggy bank. Brass coins turn, align with its slot, and drop inside.">
        <SceneBoundary>
          <Canvas shadows dpr={[1, 1.5]} camera={{position:[-4.5, 2.8, 6.7], fov:38}} onCreated={({camera}) => camera.lookAt(0,.4,0)} frameloop={playing ? 'always' : 'demand'} gl={{antialias:true,alpha:true}}>
            <Suspense fallback={null}>
              <ambientLight intensity={.65} />
              <directionalLight position={[-3,6,4]} intensity={2.4} color="#fff4e6" />
              <Environment resolution={128}>
                <Lightformer form="rect" intensity={3} position={[-3,4,3]} scale={[4,5,1]} target={[0,0,0]} />
                <Lightformer form="rect" intensity={2} position={[4,2,1]} scale={[2,4,1]} target={[0,0,0]} />
                <Lightformer form="rect" intensity={2.5} position={[0,4,-4]} scale={[5,2,1]} target={[0,0,0]} />
              </Environment>
              <Bank playing={playing} replay={replay} />
              <ContactShadows position={[0,-1.405,0]} opacity={.4} scale={10} blur={2.5} far={4} resolution={256} frames={2} color="#5f4934" />
            </Suspense>
          </Canvas>
        </SceneBoundary>
      </div>
      <div className="piggy-controls">
        <span>Every contribution counts.</span>
        <div>
          <button type="button" onClick={() => { setPaused(playing); setReduced(false); }} aria-label={playing ? 'Pause piggy bank animation' : 'Play piggy bank animation'}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
          <button type="button" onClick={() => { setReplay(n => n+1); setPaused(false); setReduced(false); }} aria-label="Replay piggy bank animation"><RotateCcw size={15} /></button>
        </div>
      </div>
    </div>
  );
}
