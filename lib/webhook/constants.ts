export const TEAM_LEVEL_WEBHOOK_TRIGGERS = [
  "document.created",
  "document.updated",
  "document.deleted",
  "dataroom.created",
] as const;

export const DOCUMENT_LEVEL_WEBHOOK_TRIGGERS = [
  "link.created",
  "link.updated",
] as const;

export const LINK_LEVEL_WEBHOOK_TRIGGERS = [
  "link.viewed",
  "link.downloaded",
] as const;

export const WEBHOOK_TRIGGERS = [
  ...TEAM_LEVEL_WEBHOOK_TRIGGERS,
  ...DOCUMENT_LEVEL_WEBHOOK_TRIGGERS,
  ...LINK_LEVEL_WEBHOOK_TRIGGERS,
] as const;

export const WEBHOOK_TRIGGER_DESCRIPTIONS = {
  "link.created": "Link created",
  "link.updated": "Link updated",
  "link.deleted": "Link deleted",
  "link.viewed": "Link viewed",
  "link.downloaded": "Link downloaded",
  "document.created": "Document created",
  "document.updated": "Document updated",
  "document.deleted": "Document deleted",
  "dataroom.created": "Data room created",
} as const;
