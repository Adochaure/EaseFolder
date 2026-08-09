import { djangoScaffold } from "./django";
import { expressScaffold } from "./express";
import { flaskScaffold } from "./flask";
import { nextjsScaffold } from "./nextjs";
import { reactViteScaffold } from "./react-vite";

export type ScaffoldKey = "nextjs" | "react-vite" | "express" | "flask" | "django";

export const scaffolds = {
  nextjs: nextjsScaffold,
  "react-vite": reactViteScaffold,
  express: expressScaffold,
  flask: flaskScaffold,
  django: djangoScaffold,
} as const;

export function getScaffoldDefinition(key?: string | null) {
  if (!key) {
    return scaffolds.nextjs;
  }

  const normalizedKey = key.toLowerCase() as ScaffoldKey;

  return scaffolds[normalizedKey] ?? scaffolds.nextjs;
}
