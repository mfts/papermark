export type DataroomBannerKind = "none" | "image" | "video" | "youtube";

export type DataroomBannerClassification = {
  kind: DataroomBannerKind;
  src?: string;
  youtubeId?: string;
};

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"];
const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
];

function getUrl(path: string): URL | null {
  try {
    return new URL(path);
  } catch {
    return null;
  }
}

function getYouTubeId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase();

  if (hostname === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }

  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    const shortId = url.searchParams.get("v");
    if (shortId) return shortId;

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.indexOf("embed");
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1];
    }
  }

  return null;
}

export function classifyDataroomBanner(
  src: string | null | undefined,
): DataroomBannerClassification {
  if (!src || !src.trim()) {
    return { kind: "none" };
  }

  const trimmed = src.trim();
  const url = getUrl(trimmed);

  if (url) {
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      return { kind: "youtube", src: trimmed, youtubeId };
    }
  }

  const path = (url?.pathname ?? trimmed.split(/[?#]/, 1)[0]).toLowerCase();
  if (VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext))) {
    return { kind: "video", src: trimmed };
  }

  if (IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext))) {
    return { kind: "image", src: trimmed };
  }

  return { kind: "image", src: trimmed };
}