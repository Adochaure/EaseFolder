import type { ProjectNode } from "@/lib/project-tree";
import type { ProjectStack, ProjectMemory } from "@/backend/session/project-session";

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function summarizeAction(action: { type: string; path?: string; destination?: string }) {
  if (action.type === "move") {
    return `Moved ${action.path} to ${action.destination}`;
  }

  if (action.type === "rename") {
    return `Renamed ${action.path}`;
  }

  if (action.type === "delete") {
    return `Deleted ${action.path}`;
  }

  return `${action.type}: ${action.path ?? ""}`.trim();
}

export function createInitialProjectMemory(): ProjectMemory {
  return {
    summary: "",
    requirements: [],
    decisions: [],
  };
}

export function updateProjectMemory(
  currentMemory: ProjectMemory,
  projectName: string,
  description: string,
  stack: ProjectStack,
  latestMessage: string,
  aiMessage: string,
  actions: Array<{ type: string; path?: string; destination?: string }>,
  tree: ProjectNode[],
): ProjectMemory {
  const nextRequirements = uniqueStrings([
    ...currentMemory.requirements,
    latestMessage,
  ]).slice(-16);

  const nextDecisions = uniqueStrings([
    ...currentMemory.decisions,
    ...actions.map((action) => summarizeAction(action)),
    stack.framework ? `Framework: ${stack.framework}` : "",
    stack.language ? `Language: ${stack.language}` : "",
    stack.database ? `Database: ${stack.database}` : "",
    stack.orm ? `ORM: ${stack.orm}` : "",
    stack.styling ? `Styling: ${stack.styling}` : "",
  ]).slice(-16);

  const treeSummary = tree
    .map((node) => `${node.type === "folder" ? "folder" : "file"}:${node.name}`)
    .slice(0, 12)
    .join(", ");

  const summary = [
    projectName ? `Project: ${projectName}` : "",
    description ? `Description: ${description}` : "",
    stack.framework ? `Framework: ${stack.framework}` : "",
    latestMessage ? `Latest request: ${latestMessage}` : "",
    aiMessage ? `Last AI response: ${aiMessage}` : "",
    treeSummary ? `Tree: ${treeSummary}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    summary,
    requirements: nextRequirements,
    decisions: nextDecisions,
  };
}
