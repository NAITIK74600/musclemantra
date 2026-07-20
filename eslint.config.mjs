import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // This is a static-export, client-hydrated site: components intentionally
      // read persisted state (localStorage / sessionStorage) inside a mount
      // effect. That is the correct pattern here, not a cascading-render bug.
      "react-hooks/set-state-in-effect": "off",
      // Plain <img> is intentional: next/image optimization is disabled
      // (images.unoptimized) because the app is exported as static HTML.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
