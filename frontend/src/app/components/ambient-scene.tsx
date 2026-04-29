"use client";

/**
 * AmbientScene -- the shared Three.js background used across the whole app.
 *
 * 17 geometry variants, one per surface in the app, so every route gets a
 * distinct 3D shape:
 *
 *   blob, torus, helix, wire, knot, ring, orbit, octa, ribbon, crystal,
 *   cube, spiral, cone, cylinder, tetra, particles, lattice
 *
 * Light + dark modes adjust ambient/key intensity and emissive levels so
 * the same geometry reads cleanly on the dark public pages and the soft-
 * green dashboard chrome.
 *
 * Position modes:
 *   - "background" : fixed inset-0 (covers viewport, behind page content)
 *   - "hero"       : absolute inset-0 (scoped to a parent container)
 *
 * Honors prefers-reduced-motion (drops morph + breath; rotation stays so
 * the page doesn't feel dead) and pauses when the tab is hidden.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type SceneVariant =
  | "blob"
  | "torus"
  | "helix"
  | "wire"
  | "knot"
  | "ring"
  | "orbit"
  | "octa"
  | "ribbon"
  | "crystal"
  | "cube"
  | "spiral"
  | "cone"
  | "cylinder"
  | "tetra"
  | "particles"
  | "lattice";

export type SceneMode = "light" | "dark";
export type ScenePosition = "background" | "hero";

interface AmbientSceneProps {
  variant?: SceneVariant;
  mode?: SceneMode;
  intensity?: number;
  position?: ScenePosition;
  className?: string;
}

export default function AmbientScene({
  variant = "blob",
  mode = "dark",
  intensity = 1,
  position = "background",
  className = "",
}: AmbientSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ---- Renderer + camera ----
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 4.2 + (1 - intensity) * 1.5);

    // ---- Lights (mode-aware) ----
    scene.add(new THREE.AmbientLight(0xffffff, mode === "light" ? 0.55 : 0.32));

    const keyColor = mode === "light" ? 0x9df2c8 : 0x60d394;
    const fillColor = mode === "light" ? 0x60d394 : 0x108a54;

    const keyLight = new THREE.PointLight(keyColor, 70 * intensity, 60, 1.6);
    keyLight.position.set(3.5, 2.5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(fillColor, 45 * intensity, 60, 1.6);
    fillLight.position.set(-4, -2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xc7ffdc, 35 * intensity, 40, 1.8);
    rimLight.position.set(0, -3.5, -2.5);
    scene.add(rimLight);

    // Shared palette + bookkeeping.
    const baseColor = new THREE.Color(mode === "light" ? "#108a54" : "#3ad594");
    const emissiveColor = new THREE.Color("#0a3a23");
    const wireColorHex = mode === "light" ? 0x108a54 : 0xc7ffdc;
    const wireOpacity = mode === "light" ? 0.18 : 0.22;

    const disposables: { dispose: () => void }[] = [];
    const animatables: ((t: number) => void)[] = [];

    /** Standard "soft glow" material used by most variants. */
    const stdMat = (emissiveBoost = 0.55) =>
      new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity: emissiveBoost * intensity,
        roughness: 0.42,
        metalness: 0.18,
      });

    const wireMat = (opacity = wireOpacity) =>
      new THREE.MeshBasicMaterial({
        color: wireColorHex,
        wireframe: true,
        transparent: true,
        opacity,
      });

    // ---------------- VARIANTS ----------------

    if (variant === "blob") {
      // Breathing icosphere (organic, calming).
      const geometry = new THREE.IcosahedronGeometry(1.45, 4);
      const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
      const original = new Float32Array(positionAttr.array);
      const body = new THREE.Mesh(geometry, stdMat());
      const wire = new THREE.Mesh(geometry, wireMat(mode === "light" ? 0.08 : 0.14));
      wire.scale.setScalar(1.005);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        if (!reducedMotion) {
          for (let i = 0; i < positionAttr.count; i++) {
            const ix = i * 3;
            const ox = original[ix], oy = original[ix + 1], oz = original[ix + 2];
            const noise =
              Math.sin(ox * 1.8 + t * 0.7) *
              Math.cos(oy * 1.8 + t * 0.5) *
              Math.sin(oz * 1.8 + t * 0.6) * 0.16;
            const r = 1 + noise;
            positionAttr.setXYZ(i, ox * r, oy * r, oz * r);
          }
          positionAttr.needsUpdate = true;
          geometry.computeVertexNormals();
        }
        body.rotation.x = t * 0.12;
        body.rotation.y = t * 0.18;
        wire.rotation.copy(body.rotation);
      });
    } else if (variant === "torus") {
      // Slow torus + breath scale.
      const geometry = new THREE.TorusGeometry(1.05, 0.34, 24, 120);
      const body = new THREE.Mesh(geometry, stdMat(0.5));
      const wire = new THREE.Mesh(geometry, wireMat(mode === "light" ? 0.08 : 0.14));
      wire.scale.setScalar(1.005);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.x = t * 0.18;
        body.rotation.y = t * 0.12;
        const breath = reducedMotion ? 1 : 1 + Math.sin(t * 0.7) * 0.05;
        body.scale.setScalar(breath);
        wire.rotation.copy(body.rotation);
        wire.scale.copy(body.scale);
      });
    } else if (variant === "helix") {
      // Double helix of orbs.
      const group = new THREE.Group();
      const orbGeom = new THREE.SphereGeometry(0.085, 16, 16);
      const orbMat = stdMat(0.6);
      const radius = 0.9, height = 2.6, count = 56;
      for (let i = 0; i < count; i++) {
        const f = i / (count - 1);
        const angle = f * Math.PI * 4;
        for (const phase of [0, Math.PI]) {
          const orb = new THREE.Mesh(orbGeom, orbMat);
          orb.position.set(
            Math.cos(angle + phase) * radius,
            (f - 0.5) * height,
            Math.sin(angle + phase) * radius,
          );
          group.add(orb);
        }
      }
      scene.add(group);
      disposables.push(orbGeom, orbMat);
      animatables.push((t) => {
        group.rotation.y = t * 0.32;
        if (!reducedMotion) group.rotation.x = Math.sin(t * 0.4) * 0.18;
      });
    } else if (variant === "wire") {
      // Wireframe icosahedron + glowing core.
      const outerGeom = new THREE.IcosahedronGeometry(1.55, 1);
      const outerMat = wireMat(mode === "light" ? 0.45 : 0.55);
      const outer = new THREE.Mesh(outerGeom, outerMat);
      const coreGeom = new THREE.IcosahedronGeometry(0.55, 2);
      const coreMat = stdMat(0.8);
      const core = new THREE.Mesh(coreGeom, coreMat);
      scene.add(outer, core);
      disposables.push(outerGeom, outerMat, coreGeom, coreMat);
      animatables.push((t) => {
        outer.rotation.x = t * 0.15;
        outer.rotation.y = t * 0.25;
        core.rotation.x = -t * 0.2;
        core.rotation.y = -t * 0.15;
        if (!reducedMotion) core.scale.setScalar(1 + Math.sin(t * 0.9) * 0.08);
      });
    } else if (variant === "knot") {
      // Torus knot -- complex but inviting.
      const geometry = new THREE.TorusKnotGeometry(0.95, 0.28, 220, 24, 2, 3);
      const body = new THREE.Mesh(geometry, stdMat(0.6));
      const wire = new THREE.Mesh(geometry, wireMat(mode === "light" ? 0.08 : 0.12));
      wire.scale.setScalar(1.004);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.x = t * 0.18;
        body.rotation.y = t * 0.14;
        wire.rotation.copy(body.rotation);
      });
    } else if (variant === "ring") {
      // Thin ring on edge, like a halo.
      const geometry = new THREE.TorusGeometry(1.3, 0.06, 16, 160);
      const body = new THREE.Mesh(geometry, stdMat(0.7));
      const wire = new THREE.Mesh(geometry, wireMat(0.12));
      wire.scale.setScalar(1.01);
      body.rotation.x = Math.PI / 2.6;
      wire.rotation.x = body.rotation.x;
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.z = t * 0.4;
        wire.rotation.z = body.rotation.z;
        if (!reducedMotion) {
          body.rotation.x = Math.PI / 2.6 + Math.sin(t * 0.4) * 0.15;
          wire.rotation.x = body.rotation.x;
        }
      });
    } else if (variant === "orbit") {
      // Central sphere + ring of orbiting bodies.
      const group = new THREE.Group();
      const centerGeom = new THREE.SphereGeometry(0.45, 32, 32);
      const centerMat = stdMat(0.9);
      const center = new THREE.Mesh(centerGeom, centerMat);
      group.add(center);
      const orbGeom = new THREE.SphereGeometry(0.13, 16, 16);
      const orbMat = stdMat(0.7);
      const orbs: THREE.Mesh[] = [];
      const orbCount = 8;
      for (let i = 0; i < orbCount; i++) {
        const orb = new THREE.Mesh(orbGeom, orbMat);
        group.add(orb);
        orbs.push(orb);
      }
      scene.add(group);
      disposables.push(centerGeom, centerMat, orbGeom, orbMat);
      animatables.push((t) => {
        for (let i = 0; i < orbCount; i++) {
          const a = (i / orbCount) * Math.PI * 2 + t * 0.4;
          const r = 1.6;
          orbs[i].position.set(Math.cos(a) * r, Math.sin(a * 1.3) * 0.3, Math.sin(a) * r);
        }
        group.rotation.y = t * 0.1;
        if (!reducedMotion) center.scale.setScalar(1 + Math.sin(t * 0.8) * 0.06);
      });
    } else if (variant === "octa") {
      // Octahedron -- two pyramids back to back.
      const geometry = new THREE.OctahedronGeometry(1.2, 0);
      const body = new THREE.Mesh(geometry, stdMat(0.65));
      const wire = new THREE.Mesh(geometry, wireMat(0.18));
      wire.scale.setScalar(1.01);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.x = t * 0.22;
        body.rotation.y = t * 0.16;
        wire.rotation.copy(body.rotation);
        if (!reducedMotion) {
          const breath = 1 + Math.sin(t * 0.8) * 0.06;
          body.scale.setScalar(breath);
          wire.scale.setScalar(breath * 1.01);
        }
      });
    } else if (variant === "ribbon") {
      // Tube along a sinusoidal 3D curve -- flowing thoughts.
      class FlowingCurve extends THREE.Curve<THREE.Vector3> {
        constructor() {
          super();
        }
        getPoint(t: number, target = new THREE.Vector3()) {
          const a = t * Math.PI * 2;
          const x = Math.cos(a) * (1.0 + Math.sin(a * 3) * 0.25);
          const y = Math.sin(a * 2) * 0.7;
          const z = Math.sin(a) * (1.0 + Math.cos(a * 3) * 0.25);
          return target.set(x, y, z);
        }
      }
      const geometry = new THREE.TubeGeometry(new FlowingCurve(), 220, 0.07, 12, true);
      const body = new THREE.Mesh(geometry, stdMat(0.55));
      const wire = new THREE.Mesh(geometry, wireMat(0.1));
      wire.scale.setScalar(1.02);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.x = t * 0.1;
        body.rotation.y = t * 0.18;
        wire.rotation.copy(body.rotation);
      });
    } else if (variant === "crystal") {
      // Dodecahedron -- the gem.
      const geometry = new THREE.DodecahedronGeometry(1.15, 0);
      const body = new THREE.Mesh(geometry, stdMat(0.7));
      const wire = new THREE.Mesh(geometry, wireMat(0.2));
      wire.scale.setScalar(1.01);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.x = t * 0.15;
        body.rotation.y = t * 0.2;
        wire.rotation.copy(body.rotation);
      });
    } else if (variant === "cube") {
      // Single bevelled cube.
      const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 6, 6, 6);
      const body = new THREE.Mesh(geometry, stdMat(0.55));
      const wire = new THREE.Mesh(geometry, wireMat(0.16));
      wire.scale.setScalar(1.01);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.x = t * 0.18;
        body.rotation.y = t * 0.22;
        body.rotation.z = t * 0.05;
        wire.rotation.copy(body.rotation);
      });
    } else if (variant === "spiral") {
      // Single ascending spiral of orbs (vs helix's double).
      const group = new THREE.Group();
      const orbGeom = new THREE.SphereGeometry(0.09, 16, 16);
      const orbMat = stdMat(0.65);
      const count = 90;
      for (let i = 0; i < count; i++) {
        const f = i / (count - 1);
        const angle = f * Math.PI * 6;
        const r = 0.4 + f * 0.9;
        const orb = new THREE.Mesh(orbGeom, orbMat);
        orb.position.set(Math.cos(angle) * r, (f - 0.5) * 2.6, Math.sin(angle) * r);
        group.add(orb);
      }
      scene.add(group);
      disposables.push(orbGeom, orbMat);
      animatables.push((t) => {
        group.rotation.y = t * 0.35;
      });
    } else if (variant === "cone") {
      // Cone pointing up -- a peak.
      const geometry = new THREE.ConeGeometry(0.95, 1.7, 48, 1, false);
      const body = new THREE.Mesh(geometry, stdMat(0.6));
      const wire = new THREE.Mesh(geometry, wireMat(0.16));
      wire.scale.setScalar(1.01);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.y = t * 0.35;
        wire.rotation.y = body.rotation.y;
        if (!reducedMotion) {
          body.rotation.z = Math.sin(t * 0.6) * 0.08;
          wire.rotation.z = body.rotation.z;
        }
      });
    } else if (variant === "cylinder") {
      // Vertical cylinder -- timeline.
      const geometry = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 48, 1, false);
      const body = new THREE.Mesh(geometry, stdMat(0.55));
      const wire = new THREE.Mesh(geometry, wireMat(0.14));
      wire.scale.setScalar(1.01);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.y = t * 0.35;
        wire.rotation.y = body.rotation.y;
        if (!reducedMotion) {
          body.rotation.x = Math.sin(t * 0.4) * 0.18;
          wire.rotation.x = body.rotation.x;
        }
      });
    } else if (variant === "tetra") {
      // Tetrahedron -- four-faced pyramid.
      const geometry = new THREE.TetrahedronGeometry(1.35, 0);
      const body = new THREE.Mesh(geometry, stdMat(0.65));
      const wire = new THREE.Mesh(geometry, wireMat(0.2));
      wire.scale.setScalar(1.01);
      scene.add(body, wire);
      disposables.push(geometry, body.material as THREE.Material, wire.material as THREE.Material);
      animatables.push((t) => {
        body.rotation.x = t * 0.25;
        body.rotation.y = t * 0.18;
        wire.rotation.copy(body.rotation);
      });
    } else if (variant === "particles") {
      // Drifting cloud of points -- intelligence / awareness.
      const count = 600;
      const positions = new Float32Array(count * 3);
      const baseR = 1.7;
      for (let i = 0; i < count; i++) {
        const r = baseR * (0.4 + Math.random() * 0.6);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: mode === "light" ? 0x108a54 : 0xc7ffdc,
        size: 0.045,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geom, mat);
      scene.add(points);
      disposables.push(geom, mat);
      animatables.push((t) => {
        points.rotation.y = t * 0.1;
        points.rotation.x = Math.sin(t * 0.2) * 0.12;
      });
    } else {
      // "lattice": 3D grid of small spheres -- structured data.
      const group = new THREE.Group();
      const orbGeom = new THREE.SphereGeometry(0.06, 12, 12);
      const orbMat = stdMat(0.7);
      const N = 5;
      const span = 1.6;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          for (let z = 0; z < N; z++) {
            const orb = new THREE.Mesh(orbGeom, orbMat);
            orb.position.set(
              (x / (N - 1) - 0.5) * span,
              (y / (N - 1) - 0.5) * span,
              (z / (N - 1) - 0.5) * span,
            );
            group.add(orb);
          }
        }
      }
      scene.add(group);
      disposables.push(orbGeom, orbMat);
      animatables.push((t) => {
        group.rotation.x = t * 0.15;
        group.rotation.y = t * 0.2;
        if (!reducedMotion) {
          const s = 1 + Math.sin(t * 0.6) * 0.04;
          group.scale.setScalar(s);
        }
      });
    }

    // ---- Pointer parallax ----
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      pointer.targetX = (event.clientX / w - 0.5) * 0.55;
      pointer.targetY = (event.clientY / h - 0.5) * 0.55;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // ---- Resize ----
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ---- Pause when hidden ----
    let paused = document.hidden;
    const onVis = () => { paused = document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    // ---- Loop ----
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (paused) return;
      const t = performance.now() * 0.001;
      for (const fn of animatables) fn(t);
      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;
      camera.position.x = pointer.x;
      camera.position.y = -pointer.y;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      for (const d of disposables) d.dispose();
      renderer.dispose();
    };
  }, [variant, mode, intensity]);

  const positionClasses =
    position === "background" ? "fixed inset-0" : "absolute inset-0";

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none ${positionClasses} ${className}`}
      style={position === "background" ? { zIndex: 0 } : undefined}
    />
  );
}
