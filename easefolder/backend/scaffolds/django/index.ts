export const djangoScaffold = {
  framework: "Django",
  language: "Python",
  rootFolders: ["project", "apps", "templates", "static"],
  rootFiles: ["manage.py", "README.md"],
  notes: ["Use apps/ for feature modules and keep settings isolated."],
} as const;
