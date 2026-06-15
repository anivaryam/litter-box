import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts", react: "src/react.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    external: ["react", "react-dom"],
  },
  {
    entry: { "litter-box": "src/index.ts" },
    format: ["iife"],
    globalName: "LitterBoxLib",
    minify: true,
  },
]);
