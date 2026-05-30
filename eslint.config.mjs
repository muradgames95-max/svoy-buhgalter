import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.cjs",
  ]),
  {
    rules: {
      // localStorage hydration pattern (useEffect → setState) is correct for SSR
      "react-hooks/set-state-in-effect": "off",
      // Date.now/Math.random in event handlers are expected side effects
      "react-hooks/purity": "off",
      // window.location.href = url is valid browser navigation
      "react-hooks/immutable-props": "off",
      "react-hooks/immutability": "off",
      // local let variable accumulation in pure render functions is fine
      "react-hooks/reassignment-vars": "off",
      // React Compiler auto-memoizes — manual useMemo is intentional here
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
