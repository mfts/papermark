import { GoogleTagManager } from "@next/third-parties/google";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GTMComponent() {
  if (!GTM_ID) {
    return null;
  }

  return <GoogleTagManager gtmId={GTM_ID} />;
}
