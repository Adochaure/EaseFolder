export const reactViteScaffold = {
  framework: "React + Vite",
  language: "TypeScript",
  rootFolders: ["src", "public"],
  rootFiles: ["package.json", "vite.config.ts", "tsconfig.json", "README.md"],
  notes: [
    "Keep the app entry inside src/.",
    "Shared components usually live in src/components/.",
  ],
} as const;
