export const nextjsScaffold = {
  framework: "Next.js",
  language: "TypeScript",
  rootFolders: ["app", "components", "lib", "public"],
  rootFiles: [
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "README.md",
  ],
  notes: [
    "App Router-based structure.",
    "Place route files inside app/.",
    "Keep shared utilities inside lib/.",
  ],
} as const;
