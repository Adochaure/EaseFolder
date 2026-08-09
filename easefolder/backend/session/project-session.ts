import { normalizeProjectTree, type ProjectNode } from "@/lib/project-tree";

export type ProjectStack = {
  framework?: string;
  language?: string;
  database?: string;
  orm?: string;
  styling?: string;
};

export type ProjectMemory = {
  summary: string;
  requirements: string[];
  decisions: string[];
};

export type SessionMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ProjectSession = {
  projectId: string;
  projectName: string;
  description: string;
  stack: ProjectStack;
  messages: SessionMessage[];
  tree: ProjectNode[];
  projectMemory: ProjectMemory;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSessionSnapshot = {
  projectName?: string;
  description?: string;
  stack?: ProjectStack;
  tree?: ProjectNode[];
  projectMemory?: ProjectMemory;
};

const sessions = new Map<string, ProjectSession>();

function nowIso() {
  return new Date().toISOString();
}

function normalizeStack(stack?: ProjectStack): ProjectStack {
  return {
    framework: stack?.framework?.trim() || "Next.js",
    language: stack?.language?.trim() || "TypeScript",
    database: stack?.database?.trim() || undefined,
    orm: stack?.orm?.trim() || undefined,
    styling: stack?.styling?.trim() || "Tailwind CSS",
  };
}

function normalizeMemory(memory?: ProjectMemory): ProjectMemory {
  return {
    summary: memory?.summary?.trim() || "",
    requirements: Array.from(
      new Set((memory?.requirements ?? []).map((item) => item.trim()).filter(Boolean)),
    ),
    decisions: Array.from(
      new Set((memory?.decisions ?? []).map((item) => item.trim()).filter(Boolean)),
    ),
  };
}

export function createProjectSession(
  projectId: string,
  snapshot?: ProjectSessionSnapshot,
): ProjectSession {
  const timestamp = nowIso();

  return {
    projectId,
    projectName: snapshot?.projectName?.trim() || "my-next-app",
    description: snapshot?.description?.trim() || "",
    stack: normalizeStack(snapshot?.stack),
    messages: [],
    tree: normalizeProjectTree(snapshot?.tree ?? []),
    projectMemory: normalizeMemory(snapshot?.projectMemory),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function loadProjectSession(projectId: string): ProjectSession | null {
  return sessions.get(projectId) ?? null;
}

export function upsertProjectSession(
  projectId: string,
  snapshot?: ProjectSessionSnapshot,
): ProjectSession {
  const existingSession = sessions.get(projectId);

  if (!existingSession) {
    const createdSession = createProjectSession(projectId, snapshot);
    sessions.set(projectId, createdSession);
    return createdSession;
  }

  const nextSession: ProjectSession = {
    ...existingSession,
    projectName: snapshot?.projectName?.trim() || existingSession.projectName,
    description: snapshot?.description?.trim() || existingSession.description,
    stack: normalizeStack({ ...existingSession.stack, ...snapshot?.stack }),
    tree: snapshot?.tree ? normalizeProjectTree(snapshot.tree) : existingSession.tree,
    projectMemory: normalizeMemory(snapshot?.projectMemory ?? existingSession.projectMemory),
    updatedAt: nowIso(),
  };

  sessions.set(projectId, nextSession);
  return nextSession;
}

export function commitProjectSession(session: ProjectSession): ProjectSession {
  const nextSession = {
    ...session,
    updatedAt: nowIso(),
  };

  sessions.set(session.projectId, nextSession);
  return nextSession;
}

export function ensureProjectSession(
  projectId: string,
  snapshot?: ProjectSessionSnapshot,
): ProjectSession {
  return upsertProjectSession(projectId, snapshot);
}

export function appendSessionMessage(
  session: ProjectSession,
  message: SessionMessage,
): ProjectSession {
  const nextMessages = [...session.messages, message].slice(-40);

  return commitProjectSession({
    ...session,
    messages: nextMessages,
  });
}

export function mergeSessionSnapshot(
  session: ProjectSession,
  snapshot?: ProjectSessionSnapshot,
): ProjectSession {
  if (!snapshot) {
    return session;
  }

  return commitProjectSession({
    ...session,
    projectName: snapshot.projectName?.trim() || session.projectName,
    description: snapshot.description?.trim() || session.description,
    stack: normalizeStack({ ...session.stack, ...snapshot.stack }),
    tree: snapshot.tree ? normalizeProjectTree(snapshot.tree) : session.tree,
    projectMemory: normalizeMemory(snapshot.projectMemory ?? session.projectMemory),
  });
}
