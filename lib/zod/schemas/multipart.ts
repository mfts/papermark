import { z } from "zod";

// Schema for multipart upload part
const MultipartPartSchema = z.object({
  ETag: z.string().min(1, "ETag is required"),
  PartNumber: z.number().int().min(1, "PartNumber must be a positive integer"),
});

// Base schema for common fields
const MultipartBaseSchema = z.object({
  fileName: z.string().min(1, "fileName is required"),
  contentType: z.string().min(1, "contentType is required"),
  teamId: z.string().min(1, "teamId is required"),
  docId: z.string().min(1, "docId is required"),
});

// Schema for initiate action
const MultipartInitiateSchema = MultipartBaseSchema.extend({
  action: z.literal("initiate"),
});

// Schema for get-part-urls action
const MultipartGetPartUrlsSchema = MultipartBaseSchema.extend({
  action: z.literal("get-part-urls"),
  uploadId: z.string().min(1, "uploadId is required for get-part-urls action"),
  fileSize: z.number().int().min(1, "fileSize must be a positive integer"),
  partSize: z
    .number()
    .int()
    .min(5 * 1024 * 1024, "partSize must be at least 5MB")
    .default(10 * 1024 * 1024),
});

// Schema for complete action
const MultipartCompleteSchema = MultipartBaseSchema.extend({
  action: z.literal("complete"),
  uploadId: z.string().min(1, "uploadId is required for complete action"),
  parts: z.array(MultipartPartSchema).min(1, "At least one part is required"),
});

// Union schema for all multipart actions
export const MultipartUploadSchema = z.discriminatedUnion("action", [
  MultipartInitiateSchema,
  MultipartGetPartUrlsSchema,
  MultipartCompleteSchema,
]);

// Type exports
export type MultipartUploadRequest = z.infer<typeof MultipartUploadSchema>;
export type MultipartPart = z.infer<typeof MultipartPartSchema>;
export type MultipartInitiateRequest = z.infer<typeof MultipartInitiateSchema>;
export type MultipartGetPartUrlsRequest = z.infer<
  typeof MultipartGetPartUrlsSchema
>;
export type MultipartCompleteRequest = z.infer<typeof MultipartCompleteSchema>;
