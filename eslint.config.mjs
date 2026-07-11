import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Legacy codebase: track debt as warnings so lint stays actionable without blocking CI.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
  {
    files: ["src/app/docs/**/*.tsx", "src/components/docs/**/*.tsx"],
    rules: {
      // DocTable rows use tuple syntax [<code>…</code>, "label"] — keys are applied in DocTable render.
      "react/jsx-key": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "e2e/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
