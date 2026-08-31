/**
 * GoHighLevel (GHL) webhook integration for self-hosted Papermark.
 *
 * When GHL_WEBHOOK_URL is set, every `link.viewed` event is forwarded to that
 * URL as a flat contact payload that GHL workflow triggers understand natively.
 *
 * Set up in GHL:
 *  1. Automations → Create workflow → Trigger: "Inbound Webhook"
 *  2. Copy the trigger URL into GHL_WEBHOOK_URL in your .env
 *  3. Map fields: email → Contact Email, firstName / lastName → name fields,
 *     and any "papermark_*" custom fields you want stored on the contact.
 */

export interface GhlContactPayload {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  /** ISO datetime the document link was viewed */
  papermark_viewed_at: string;
  /** Human-readable link name or ID */
  papermark_link_name: string | null;
  /** Full link URL e.g. https://yourhost/view/clxxx */
  papermark_link_url: string;
  /** Document name if the link points to a document */
  papermark_document_name: string | null;
  /** Dataroom name if the link points to a dataroom */
  papermark_dataroom_name: string | null;
  /** Viewer country (2-letter ISO code) */
  papermark_country: string | null;
  /** Viewer city */
  papermark_city: string | null;
  /** Viewer device type */
  papermark_device: string | null;
  /** Unique Papermark view ID */
  papermark_view_id: string;
}

/**
 * Sends a link.viewed event to GHL as a contact payload.
 * No-ops silently when GHL_WEBHOOK_URL is not configured.
 */
export async function sendGhlViewEvent(data: {
  view: {
    viewId: string;
    email: string | null;
    viewedAt: string;
    country?: string | null;
    city?: string | null;
    device?: string | null;
  };
  link: {
    id: string;
    url: string;
    name: string | null;
  };
  document?: { name: string } | null;
  dataroom?: { name: string } | null;
}): Promise<void> {
  const ghlUrl = process.env.GHL_WEBHOOK_URL;
  if (!ghlUrl) return;

  const rawEmail = data.view.email ?? "";
  const nameParts = rawEmail.split("@")[0]?.split(/[._-]/) ?? [];
  const firstName = nameParts[0]
    ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)
    : null;
  const lastName =
    nameParts.length > 1
      ? nameParts
          .slice(1)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" ")
      : null;

  const payload: GhlContactPayload = {
    email: data.view.email,
    firstName,
    lastName,
    papermark_viewed_at: data.view.viewedAt,
    papermark_link_name: data.link.name,
    papermark_link_url: data.link.url,
    papermark_document_name: data.document?.name ?? null,
    papermark_dataroom_name: data.dataroom?.name ?? null,
    papermark_country: data.view.country ?? null,
    papermark_city: data.view.city ?? null,
    papermark_device: data.view.device ?? null,
    papermark_view_id: data.view.viewId,
  };

  try {
    const response = await fetch(ghlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `GHL webhook responded ${response.status}: ${text.slice(0, 200)}`,
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send event to GHL webhook: ${msg}`);
  }
}
