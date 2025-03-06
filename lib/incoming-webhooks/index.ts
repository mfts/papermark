// lib/incoming-webhooks.ts
import crypto from "crypto";

import { newId } from "../id-helper";

function generateBase62String(length: number): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}

function encodeTeamId(teamId: string): string {
  // Convert the teamId to a Buffer if it's not already
  const buffer = Buffer.from(teamId);
  // Convert to base62 string
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function decodeTeamId(encoded: string): string {
  // Add back the padding
  const padding = "=".repeat((4 - (encoded.length % 4)) % 4);
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/") + padding;

  return Buffer.from(base64, "base64").toString();
}

export function generateWebhookId(teamId: string): string {
  // Format: T{encoded_team_id}/B{8 chars}/{24 chars}
  const encodedTeamId = encodeTeamId(teamId);
  const botPart = generateBase62String(8);
  const secretPart = generateBase62String(24);

  return `T${encodedTeamId}/B${botPart}/${secretPart}`;
}

export function extractTeamId(webhookId: string): string | null {
  try {
    const [teamPart] = webhookId.split("/");
    if (!teamPart || !teamPart.startsWith("T")) return null;

    const encodedTeamId = teamPart.slice(1); // Remove 'T' prefix
    return decodeTeamId(encodedTeamId);
  } catch {
    return null;
  }
}

export function isValidWebhookId(webhookId: string): boolean {
  // Validate format: T{encoded_team_id}/B{8}/{\24}
  const parts = webhookId.split("/");
  return (
    parts.length === 3 &&
    parts[0].startsWith("T") &&
    parts[1].startsWith("B") &&
    parts[1].length === 9 && // 'B' + 8 chars
    parts[2].length === 24
  );
}

export function generateWebhookSecret(): string {
  return newId("webhookSecret"); // whsec_
}
