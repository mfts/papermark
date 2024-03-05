export function getPostHogConfig(): { key: string; host: string } | null {
  const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const postHogHost = `${process.env.NEXT_PUBLIC_BASE_URL}/ingest`;

  if (!postHogKey || !postHogHost) {
    return null;
  }

  return {
    key: postHogKey,
    host: postHogHost,
  };
}
