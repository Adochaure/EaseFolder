export const flaskScaffold = {
  framework: "Flask",
  language: "Python",
  rootFolders: ["app", "templates", "static", "tests"],
  rootFiles: ["requirements.txt", "README.md"],
  notes: ["Keep application factory logic in app/ where possible."],
} as const;
