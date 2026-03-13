'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.clientWidth || 480;
    const h = el.clientHeight || 480;

    // Scene + camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.z = 6;

    // Renderer (transparent bg)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Two-group setup: parallaxGroup > spinGroup
    // parallaxGroup handles mouse tilt, spinGroup handles auto-rotation
    const parallaxGroup = new THREE.Group();
    const spinGroup = new THREE.Group();
    parallaxGroup.add(spinGroup);
    scene.add(parallaxGroup);

    // Outer wireframe icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(2.0, 3);
    const outerLines = new THREE.LineSegments(
      new THREE.WireframeGeometry(outerGeo),
      new THREE.LineBasicMaterial({ color: 0xF97316, opacity: 0.22, transparent: true })
    );
    spinGroup.add(outerLines);

    // Mid wireframe (counter-rotates for visual depth)
    const midGeo = new THREE.IcosahedronGeometry(1.3, 2);
    const midLines = new THREE.LineSegments(
      new THREE.WireframeGeometry(midGeo),
      new THREE.LineBasicMaterial({ color: 0xFBBF24, opacity: 0.18, transparent: true })
    );
    spinGroup.add(midLines);

    // Inner core (tiny, subtle)
    const coreGeo = new THREE.OctahedronGeometry(0.6, 1);
    const coreLines = new THREE.LineSegments(
      new THREE.WireframeGeometry(coreGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.1, transparent: true })
    );
    spinGroup.add(coreLines);

    // Donation particles — dots scattered in a shell around the sphere
    const N = 280;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - 2 * Math.random());
      const theta = Math.random() * Math.PI * 2;
      const r = 2.0 + Math.random() * 1.0;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptMesh = new THREE.Points(
      ptGeo,
      new THREE.PointsMaterial({ color: 0xFBBF24, size: 0.045, transparent: true, opacity: 0.75 })
    );
    spinGroup.add(ptMesh);

    // Mouse parallax state
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 0.7;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.7;
    };
    window.addEventListener('mousemove', onMouseMove);

    let t = 0;
    let raf: number;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.006;

      // Smooth mouse parallax
      currentX += (targetX - currentX) * 0.035;
      currentY += (targetY - currentY) * 0.035;

      // Spin group auto-rotates the whole globe
      spinGroup.rotation.y = t;

      // Individual counter-rotations for visual complexity
      midLines.rotation.y  = -t * 1.6;
      midLines.rotation.z  =  t * 0.4;
      coreLines.rotation.x =  t * 1.2;
      coreLines.rotation.z = -t * 0.8;
      ptMesh.rotation.y    =  t * 0.35;
      ptMesh.rotation.x    =  t * 0.12;

      // Apply mouse parallax to outer group
      parallaxGroup.rotation.y =  currentX;
      parallaxGroup.rotation.x = -currentY;

      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      outerGeo.dispose();
      midGeo.dispose();
      coreGeo.dispose();
      ptGeo.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
