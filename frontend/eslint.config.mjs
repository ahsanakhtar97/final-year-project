import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // `next lint` used to skip build output implicitly. It was removed in
  // Next 16, so `eslint .` needs these spelled out -- without them ESLint
  // walks .next/ and reports thousands of errors in generated bundles.
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // tailwind/postcss configs are loaded by Node as CommonJS, so require()
  // is correct there -- the TS rule doesn't apply.
  {
    files: ["*.config.js", "*.config.mjs", "*.config.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
