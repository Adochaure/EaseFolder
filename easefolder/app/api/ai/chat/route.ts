import { NextResponse } from "next/server";
import { aiChatRequestSchema } from "@/backend/ai/schemas";
import { runProjectAgent } from "@/backend/ai/project-agent";
import {
  appendSessionMessage,
  commitProjectSession,
  ensureProjectSession,
  mergeSessionSnapshot,
  type SessionMessage,
  type ProjectSessionSnapshot,
} from "@/backend/session/project-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsedBody = aiChatRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
        },
        { status: 400 },
      );
    }

    const { projectId, message, projectSnapshot } = parsedBody.data;

    const session = ensureProjectSession(
      projectId,
      projectSnapshot as ProjectSessionSnapshot | undefined,
    );

    const syncedSession = mergeSessionSnapshot(session, projectSnapshot as ProjectSessionSnapshot | undefined);

    const userMessage: SessionMessage = {
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    const userSession = appendSessionMessage(syncedSession, userMessage);

    const projectResult = await runProjectAgent(userSession, message);

    const assistantMessage: SessionMessage = {
      role: "assistant",
      content: projectResult.response.message,
      createdAt: new Date().toISOString(),
    };

    const updatedSession = commitProjectSession({
      ...userSession,
      tree: projectResult.tree,
      projectMemory: projectResult.projectMemory,
      messages: [...userSession.messages, assistantMessage].slice(-40),
    });

    console.log("Session saved", {
      projectId: updatedSession.projectId,
      messageCount: updatedSession.messages.length,
      treeSize: updatedSession.tree.length,
    });

    return NextResponse.json({
      message: projectResult.response.message,
      actions: projectResult.response.actions,
      tree: projectResult.tree,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    console.log("AI chat error", { message });

    if (message.includes("GROQ_API_KEY is not configured") || message.includes("Grok request failed")) {
      return NextResponse.json(
        {
          error: "Unable to reach the AI service. Please try again.",
        },
        { status: 503 },
      );
    }

    if (message.includes("Invalid AI response format")) {
      return NextResponse.json(
        {
          error: "I couldn't safely apply those changes. Your existing project structure was not changed.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error: "Unexpected backend error. Please try again.",
      },
      { status: 500 },
    );
  }
}
