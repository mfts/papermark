import { z } from "zod";

/**
 * Schema to validate folder path parameters in catch-all routes.
 * Protects against both type confusion and path traversal attacks.
 */
export const folderPathSchema = z
  .array(
    z
      .string()
      .min(1, "Folder name cannot be empty")
      .refine(
        (name) => !name.includes(".."),
        "Path traversal attempts are not allowed",
      )
      .refine(
        (name) => !name.includes("/"),
        "Folder names cannot contain forward slashes",
      )
      .refine(
        (name) => !name.includes("\\"),
        "Folder names cannot contain backslashes",
      ),
  )
  .min(1, "Folder path cannot be empty");

/**
 * Type for validated folder path
 */
export type FolderPath = z.infer<typeof folderPathSchema>;
