import type { ProjectNode } from "@/lib/project-tree";

const INVALID_SEGMENT_PATTERN = /[<>:"|?*\x00\\/]/;

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectValidationError";
  }
}

export function validateNodeName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ProjectValidationError("Names cannot be empty.");
  }

  if (trimmedName === "." || trimmedName === "..") {
    throw new ProjectValidationError("Path traversal is not allowed.");
  }

  if (INVALID_SEGMENT_PATTERN.test(trimmedName)) {
    throw new ProjectValidationError(`Invalid name: ${trimmedName}`);
  }

  if (trimmedName !== name) {
    throw new ProjectValidationError("Names cannot start or end with spaces.");
  }

  return trimmedName;
}

export function resolveRelativePath(
  inputPath: string,
  options?: { allowRoot?: boolean },
): { segments: string[]; isRoot: boolean; normalizedPath: string } {
  const allowRoot = options?.allowRoot ?? false;
  const normalizedPath = inputPath.replaceAll("\\", "/").trim();

  if (!normalizedPath) {
    if (allowRoot) {
      return { segments: [], isRoot: true, normalizedPath: "" };
    }

    throw new ProjectValidationError("Path cannot be empty.");
  }

  if (normalizedPath.startsWith("/") || normalizedPath.includes("://")) {
    throw new ProjectValidationError("Absolute paths are not allowed.");
  }

  const segments = normalizedPath.split("/");

  if (segments.some((segment) => !segment)) {
    throw new ProjectValidationError("Path contains an empty segment.");
  }

  segments.forEach((segment) => {
    validateNodeName(segment);
  });

  return {
    segments,
    isRoot: false,
    normalizedPath,
  };
}

export function validateProjectTree(nodes: ProjectNode[]): void {
  const walk = (currentNodes: ProjectNode[], pathPrefix: string[]) => {
    const siblingNames = new Set<string>();

    for (const node of currentNodes) {
      validateNodeName(node.name);

      if (siblingNames.has(node.name)) {
        const pathLabel = [...pathPrefix, node.name].join("/") || node.name;
        throw new ProjectValidationError(`Duplicate entry detected at ${pathLabel}.`);
      }

      siblingNames.add(node.name);

      if (node.type === "folder") {
        walk(node.children ?? [], [...pathPrefix, node.name]);
      }
    }
  };

  walk(nodes, []);
}
