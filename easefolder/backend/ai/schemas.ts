import { z } from "zod";
import type { ProjectNode } from "@/lib/project-tree";

const projectNodeSchema: z.ZodType<ProjectNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(["file", "folder"]),
    children: z.array(projectNodeSchema).optional(),
  }),
);

export const projectStackSchema = z.object({
  framework: z.string().optional(),
  language: z.string().optional(),
  database: z.string().optional(),
  orm: z.string().optional(),
  styling: z.string().optional(),
});

export const projectMemorySchema = z.object({
  summary: z.string().default(""),
  requirements: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
});

export const projectSnapshotSchema = z.object({
  projectName: z.string().optional(),
  description: z.string().optional(),
  stack: projectStackSchema.optional(),
  tree: z.array(projectNodeSchema).default([]),
  projectMemory: projectMemorySchema.optional(),
});

export const projectActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_file"),
    path: z.string().min(1),
  }),
  z.object({
    type: z.literal("create_folder"),
    path: z.string().min(1),
  }),
  z.object({
    type: z.literal("rename"),
    path: z.string().min(1),
    newName: z.string().min(1),
  }),
  z.object({
    type: z.literal("delete"),
    path: z.string().min(1),
  }),
  z.object({
    type: z.literal("move"),
    path: z.string().min(1),
    destination: z.string(),
  }),
]);

export const aiResponseSchema = z.object({
  message: z.string().min(1),
  actions: z.array(projectActionSchema).default([]),
});

export const aiChatRequestSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1),
  projectSnapshot: projectSnapshotSchema.optional(),
});

export const projectSessionSyncRequestSchema = z.object({
  projectId: z.string().min(1),
  projectSnapshot: projectSnapshotSchema.optional(),
});

export const sessionMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  createdAt: z.string().min(1),
});

export type ProjectAction = z.infer<typeof projectActionSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;
export type ProjectSnapshot = z.infer<typeof projectSnapshotSchema>;
export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;
export type ProjectSessionSyncRequest = z.infer<typeof projectSessionSyncRequestSchema>;
export type SessionMessage = z.infer<typeof sessionMessageSchema>;
