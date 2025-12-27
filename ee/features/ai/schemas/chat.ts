import { z } from "zod";

/**
 * Schema for creating a new chat
 */
export const createChatSchema = z.object({
  documentId: z.string().cuid().optional(),
  dataroomId: z.string().cuid().optional(),
  linkId: z.string().cuid().optional(),
  viewId: z.string().cuid().optional(),
  title: z.string().max(100).optional(),
  viewerId: z.string().cuid().optional(),
});

/**
 * Schema for sending a message
 */
export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  /** Optional document ID to filter file_search results to a specific document */
  filterDocumentId: z.string().cuid().optional(),
  /** Optional array of dataroom document IDs to filter file_search results */
  filterDataroomDocumentIds: z.array(z.string().cuid()).optional(),
});

/**
 * Schema for indexing a document
 */
export const indexDocumentSchema = z.object({
  documentId: z.string().cuid(),
  versionId: z.string().cuid().optional(),
});

/**
 * Schema for indexing a dataroom
 */
export const indexDataroomSchema = z.object({
  dataroomId: z.string().cuid(),
  documentIds: z.array(z.string().cuid()).optional(),
});

/**
 * Schema for chat query parameters
 */
export const chatQuerySchema = z.object({
  teamId: z.string().cuid().optional(),
  documentId: z.string().cuid().optional(),
  dataroomId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  viewerId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Schema for enabling agents on a document
 */
export const enableDocumentAgentsSchema = z.object({
  agentsEnabled: z.boolean(),
});

/**
 * Schema for enabling agents on a dataroom
 */
export const enableDataroomAgentsSchema = z.object({
  agentsEnabled: z.boolean(),
});

/**
 * Schema for enabling agents on a team
 */
export const enableTeamAgentsSchema = z.object({
  agentsEnabled: z.boolean(),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type IndexDocumentInput = z.infer<typeof indexDocumentSchema>;
export type IndexDataroomInput = z.infer<typeof indexDataroomSchema>;
export type ChatQueryInput = z.infer<typeof chatQuerySchema>;
export type EnableDocumentAgentsInput = z.infer<
  typeof enableDocumentAgentsSchema
>;
export type EnableDataroomAgentsInput = z.infer<
  typeof enableDataroomAgentsSchema
>;
export type EnableTeamAgentsInput = z.infer<typeof enableTeamAgentsSchema>;
