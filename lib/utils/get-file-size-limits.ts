type FileSizeLimits = {
  video: number;
  document: number;
  image: number;
  excel: number;
  maxFiles: number;
};

export function getFileSizeLimits({
  limits,
  isFreePlan,
  isTrial,
}: {
  limits?: { fileSizeLimits?: Partial<FileSizeLimits> } | null;
  isFreePlan: boolean;
  isTrial: boolean;
}): FileSizeLimits {
  // Default limits based on plan type
  const defaultLimits: FileSizeLimits = {
    video: 500, // 500MB
    document: isFreePlan && !isTrial ? 100 : 350, // 100MB free, 350MB paid
    image: isFreePlan && !isTrial ? 30 : 100, // 30MB free, 100MB paid
    excel: 40, // 40MB
    maxFiles: 150,
  };

  // If no custom limits are set, return default limits
  if (!limits?.fileSizeLimits) {
    return defaultLimits;
  }

  // Merge custom limits with defaults
  return {
    video: limits.fileSizeLimits.video ?? defaultLimits.video,
    document: limits.fileSizeLimits.document ?? defaultLimits.document,
    image: limits.fileSizeLimits.image ?? defaultLimits.image,
    excel: limits.fileSizeLimits.excel ?? defaultLimits.excel,
    maxFiles: limits.fileSizeLimits.maxFiles ?? defaultLimits.maxFiles,
  };
}

// Helper function to get size limit for a specific file type
export function getFileSizeLimit(
  fileType: string,
  limits: FileSizeLimits,
): number {
  if (fileType.startsWith("video/")) {
    return limits.video;
  }
  if (fileType.startsWith("image/")) {
    return limits.image;
  }
  if (
    fileType.startsWith(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ) ||
    fileType.startsWith("application/vnd.ms-excel") ||
    fileType.startsWith("application/vnd.oasis.opendocument.spreadsheet")
  ) {
    return limits.excel;
  }
  return limits.document;
}
