import { NextResponse } from "next/server";
import { projectSessionSyncRequestSchema } from "@/backend/ai/schemas";
import {
  ensureProjectSession,
  mergeSessionSnapshot,
} from "@/backend/session/project-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsedBody = projectSessionSyncRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const session = ensureProjectSession(
      parsedBody.data.projectId,
      parsedBody.data.projectSnapshot,
    );

    const updatedSession = mergeSessionSnapshot(session, parsedBody.data.projectSnapshot);

    console.log("Session sync", {
      projectId: updatedSession.projectId,
      treeSize: updatedSession.tree.length,
    });

    return NextResponse.json({
      projectId: updatedSession.projectId,
      tree: updatedSession.tree,
    });
  } catch (error) {
    console.log("Session sync error", {
      message: error instanceof Error ? error.message : "Unknown error.",
    });

    return NextResponse.json(
      { error: "Project session expired. Please start a new project." },
      { status: 410 },
    );
  }
}
