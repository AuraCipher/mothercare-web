'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1614');

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // The renderer constructor throws when WebGL is unavailable or blocked
    // (e.g. after context loss). This canvas is purely decorative, so degrade
    // to a static background instead of crashing the whole page.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (err) {
      console.warn('HeroCanvas: WebGL unavailable, using static background.', err);
      setWebglFailed(true);
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 60;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: '#e8dcc8',
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const shapes: THREE.Mesh[] = [];
    const shapeColors = ['#c4a882', '#d4c5a9', '#b8a88a'];
    const shapePositions = [
      { x: -8, y: 2, z: -10 },
      { x: 10, y: -3, z: -15 },
      { x: -5, y: -6, z: -20 },
    ];

    shapePositions.forEach((pos, i) => {
      const geo = new THREE.IcosahedronGeometry(1.2, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: shapeColors[i],
        transparent: true,
        opacity: 0.2,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);
      shapes.push(mesh);
    });

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;
      shapes.forEach((shape, i) => {
        shape.rotation.x += 0.002 + i * 0.001;
        shape.rotation.y += 0.003 + i * 0.001;
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      // Release the GL context immediately so repeated visits/reloads don't
      // exhaust the browser's WebGL context budget.
      renderer.forceContextLoss();
      geometry.dispose();
      material.dispose();
      shapes.forEach((s) => {
        s.geometry.dispose();
        const mats = Array.isArray(s.material) ? s.material : [s.material];
        mats.forEach((m) => m.dispose());
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div
        data-testid="hero-canvas-fallback"
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #2a2422 0%, #1a1614 60%, #14110f 100%)' }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
