import { callGrok } from "./grok";
import { aiResponseSchema, type AIResponse, type ProjectAction } from "./schemas";
import { buildGrokMessages } from "./prompts";
import { executeProjectActions } from "@/backend/project/actions";
import { updateProjectMemory } from "@/backend/project/memory";
import type { ProjectSession } from "@/backend/session/project-session";

function normalizeAction(action: ProjectAction | Record<string, unknown>): ProjectAction | null {
  if (!action || typeof action !== "object") {
    return null;
  }

  const nextAction = action as Record<string, unknown>;
  const type = nextAction.type;

  if (type === "create_file" || type === "create_folder" || type === "rename" || type === "delete" || type === "move") {
    return nextAction as ProjectAction;
  }

  if (type === "add" || type === "create") {
    const path = typeof nextAction.path === "string" ? nextAction.path : "";

    if (!path) {
      return null;
    }

    if (path.endsWith("/") || !path.includes(".")) {
      return {
        type: "create_folder",
        path,
      };
    }

    return {
      type: "create_file",
      path,
    };
  }

  return null;
}

export type ProjectAgentResult = {
  response: AIResponse;
  tree: ProjectSession["tree"];
  projectMemory: ProjectSession["projectMemory"];
};

function buildResult(
  session: ProjectSession,
  response: AIResponse,
  userMessage: string,
): ProjectAgentResult {
  const nextTree = executeProjectActions(session.tree, response.actions);
  const nextMemory = updateProjectMemory(
    session.projectMemory,
    session.projectName,
    session.description,
    session.stack,
    userMessage,
    response.message,
    response.actions,
    nextTree,
  );

  console.log("Action execution complete", {
    projectId: session.projectId,
    treeSize: nextTree.length,
  });

  return {
    response,
    tree: nextTree,
    projectMemory: nextMemory,
  };
}

export async function runProjectAgent(
  session: ProjectSession,
  userMessage: string,
): Promise<ProjectAgentResult> {
  console.log("AI request", {
    projectId: session.projectId,
    projectName: session.projectName,
    messageLength: userMessage.length,
    treeSize: session.tree.length,
  });

  const grokMessages = buildGrokMessages(session, userMessage);
  const grokResult = await callGrok(grokMessages);

  console.log("AI response received", {
    projectId: session.projectId,
    responseLength: grokResult.content.length,
  });

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(grokResult.content);
  } catch {
    console.log("AI response validation failed", {
      projectId: session.projectId,
      reason: "invalid_json",
    });
    throw new Error("Invalid AI response format.");
  }

  const parsedResponse = aiResponseSchema.safeParse(parsedPayload);

  if (!parsedResponse.success) {
    const rawPayload = parsedPayload as { message?: unknown; actions?: unknown };
    const normalizedActions = Array.isArray(rawPayload.actions)
      ? rawPayload.actions.map((action) => normalizeAction(action as Record<string, unknown>)).filter(Boolean)
      : null;

    if (!rawPayload.message || typeof rawPayload.message !== "string" || !normalizedActions) {
      console.log("AI response validation failed", {
        projectId: session.projectId,
        reason: parsedResponse.error.message,
      });
      throw new Error("Invalid AI response format.");
    }

    const normalizedResponse = aiResponseSchema.safeParse({
      message: rawPayload.message,
      actions: normalizedActions,
    });

    if (!normalizedResponse.success) {
      console.log("AI response validation failed", {
        projectId: session.projectId,
        reason: normalizedResponse.error.message,
      });
      throw new Error("Invalid AI response format.");
    }

    return buildResult(session, normalizedResponse.data, userMessage);
  }

  console.log("Action validation start", {
    projectId: session.projectId,
    actionCount: parsedResponse.data.actions.length,
  });

  return buildResult(session, parsedResponse.data, userMessage);
}
