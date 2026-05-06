/**
 * 3D scene colour palettes — one entry per colour theme.
 * Used by AmbientScene and HeroScene to tint lights + materials.
 */

export type SceneColorTheme = "green" | "purple" | "blue" | "pink" | "orange" | "yellow";

export interface ScenePalette {
  /** Mesh body colour in dark mode */
  baseDark: number;
  /** Mesh body colour in light mode */
  baseLight: number;
  /** Subtle emissive tint on the mesh */
  emissive: number;
  /** Bright key / fill light (positioned top-right-front) */
  keyLight: number;
  /** Dimmer fill light (positioned bottom-left) */
  fillLight: number;
  /** Rim / back light */
  rimLight: number;
  /** Wireframe overlay colour in dark mode */
  wireDark: number;
  /** Wireframe overlay colour in light mode */
  wireLight: number;
  /** PointsMaterial colour in dark mode (particles variant) */
  particlesDark: number;
  /** PointsMaterial colour in light mode (particles variant) */
  particlesLight: number;
}

export const SCENE_PALETTES: Record<SceneColorTheme, ScenePalette> = {
  green: {
    baseDark:       0x3ad594,
    baseLight:      0x108a54,
    emissive:       0x0a3a23,
    keyLight:       0x60d394,
    fillLight:      0x108a54,
    rimLight:       0xc7ffdc,
    wireDark:       0xc7ffdc,
    wireLight:      0x108a54,
    particlesDark:  0xc7ffdc,
    particlesLight: 0x108a54,
  },
  purple: {
    baseDark:       0xa855f7,
    baseLight:      0x7c3aed,
    emissive:       0x1a0040,
    keyLight:       0x818cf8,
    fillLight:      0x7c3aed,
    rimLight:       0xd8b4fe,
    wireDark:       0xd8b4fe,
    wireLight:      0x7c3aed,
    particlesDark:  0xd8b4fe,
    particlesLight: 0x7c3aed,
  },
  blue: {
    baseDark:       0x3b82f6,
    baseLight:      0x1d4ed8,
    emissive:       0x001440,
    keyLight:       0x38bdf8,
    fillLight:      0x1d4ed8,
    rimLight:       0x93c5fd,
    wireDark:       0x93c5fd,
    wireLight:      0x1d4ed8,
    particlesDark:  0x93c5fd,
    particlesLight: 0x1d4ed8,
  },
  pink: {
    baseDark:       0xf472b6,
    baseLight:      0xdb2777,
    emissive:       0x3b0020,
    keyLight:       0xe879f9,
    fillLight:      0xdb2777,
    rimLight:       0xf9a8d4,
    wireDark:       0xf9a8d4,
    wireLight:      0xdb2777,
    particlesDark:  0xf9a8d4,
    particlesLight: 0xdb2777,
  },
  orange: {
    baseDark:       0xf97316,
    baseLight:      0xea580c,
    emissive:       0x2d0a00,
    keyLight:       0xfbbf24,
    fillLight:      0xea580c,
    rimLight:       0xfed7aa,
    wireDark:       0xfed7aa,
    wireLight:      0xea580c,
    particlesDark:  0xfed7aa,
    particlesLight: 0xea580c,
  },
  yellow: {
    baseDark:       0xeab308,
    baseLight:      0xca8a04,
    emissive:       0x2d1a00,
    keyLight:       0xfde047,
    fillLight:      0xca8a04,
    rimLight:       0xfef08a,
    wireDark:       0xfef08a,
    wireLight:      0xca8a04,
    particlesDark:  0xfde047,
    particlesLight: 0xca8a04,
  },
};

export function getPalette(theme: SceneColorTheme = "green"): ScenePalette {
  return SCENE_PALETTES[theme] ?? SCENE_PALETTES.green;
}
