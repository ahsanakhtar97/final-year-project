"use client";

/**
 * HeroScene - a calming, organic 3D blob for the landing hero.
 *
 * Implementation notes:
 *  - Raw three.js (no @react-three/fiber) to keep the dep tree shallow.
 *  - High-detail icosahedron with per-frame vertex displacement along each
 *    vertex's normal direction. Produces a soft "breathing" morph without
 *    needing a noise library or custom shaders.
 *  - Three coloured point lights paint the sphere with GrowFlow's palette
 *    so it feels native to the page, not pasted on.
 *  - Mouse position eases the camera a touch for a parallax / "alive" feel.
 *  - Respects prefers-reduced-motion: if the user has reduced motion on, we
 *    drop the morph and just slowly rotate.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ---- Renderer ----
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // ---- Scene + camera ----
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 4.2);

    // ---- Geometry: high-detail icosahedron for smooth morph ----
    // detail=4 gives 2562 vertices -- detailed enough to read as smooth, light
    // enough to morph on the CPU every frame on mid-range hardware.
    const geometry = new THREE.IcosahedronGeometry(1.45, 4);
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const original = new Float32Array(positionAttr.array);

    // ---- Materials ----
    // Soft, slightly metallic body so the lights wrap nicely.
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3ad594"),
      emissive: new THREE.Color("#0a3a23"),
      emissiveIntensity: 0.6,
      roughness: 0.42,
      metalness: 0.18,
      flatShading: false,
    });
    const body = new THREE.Mesh(geometry, bodyMat);
    scene.add(body);

    // Translucent wireframe overlay -- adds definition without clutter.
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c7ffdc"),
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const wire = new THREE.Mesh(geometry, wireMat);
    wire.scale.setScalar(1.005);
    scene.add(wire);

    // ---- Lights ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.32));

    const keyLight = new THREE.PointLight(0x60d394, 70, 60, 1.6);
    keyLight.position.set(3.5, 2.5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x108a54, 45, 60, 1.6);
    fillLight.position.set(-4, -2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xc7ffdc, 35, 40, 1.8);
    rimLight.position.set(0, -3.5, -2.5);
    scene.add(rimLight);

    // ---- Mouse parallax ----
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.55;
      pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.55;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // ---- Resize ----
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ---- Animation loop ----
    let frameId = 0;
    const tmp = new THREE.Vector3();
    const animate = () => {
      const t = performance.now() * 0.001;

      if (!reducedMotion) {
        // Per-vertex breathing morph: each vertex moves outward along its
        // own direction by a sine of (its position * freq + time). The
        // multiplied sines across axes give a soft, non-uniform pulse that
        // never repeats exactly.
        for (let i = 0; i < positionAttr.count; i++) {
          const ix = i * 3;
          const ox = original[ix];
          const oy = original[ix + 1];
          const oz = original[ix + 2];
          tmp.set(ox, oy, oz);
          const len = tmp.length();

          const noise =
            Math.sin(ox * 1.8 + t * 0.7) *
            Math.cos(oy * 1.8 + t * 0.5) *
            Math.sin(oz * 1.8 + t * 0.6) *
            0.16;

          const r = 1 + noise;
          positionAttr.setXYZ(i, (ox / len) * len * r, (oy / len) * len * r, (oz / len) * len * r);
        }
        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();
      }

      // Slow rotation -- always on, even with reduced motion.
      body.rotation.x = t * 0.12;
      body.rotation.y = t * 0.18;
      wire.rotation.copy(body.rotation);

      // Ease camera toward pointer for parallax.
      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;
      camera.position.x = pointer.x;
      camera.position.y = -pointer.y;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    // ---- Cleanup ----
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      bodyMat.dispose();
      wireMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      // No explicit z-index. Because we're rendered as the first child of the
      // hero <section>, normal CSS stacking puts subsequent static siblings
      // (the headline, copy, buttons) on top of this absolutely-positioned
      // canvas without any z-index gymnastics.
      className="pointer-events-none absolute inset-0"
    />
  );
}
