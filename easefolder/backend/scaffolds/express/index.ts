export const expressScaffold = {
  framework: "Node + Express",
  language: "TypeScript",
  rootFolders: ["src", "routes", "controllers", "middleware", "utils"],
  rootFiles: ["package.json", "tsconfig.json", "README.md"],
  notes: ["Keep HTTP handlers separate from business logic."],
} as const;
