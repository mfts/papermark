import { get } from "@vercel/edge-config";

interface Prompts {
  "generate-dataroom-system": string;
  "generate-dataroom-user": string;
}

async function getPrompts(): Promise<Prompts> {
  if (!process.env.EDGE_CONFIG) {
    throw new Error("Edge Config not configured");
  }

  const prompts = await get<Prompts>("prompts");

  if (!prompts) {
    throw new Error("Prompts not found in Edge Config");
  }

  return prompts;
}

export async function getDataroomSystemPrompt(): Promise<string> {
  const prompts = await getPrompts();

  const prompt = prompts["generate-dataroom-system"];

  if (!prompt || typeof prompt !== "string") {
    throw new Error("Dataroom system prompt not found in Edge Config");
  }

  return prompt;
}

export async function getDataroomUserPrompt(
  description: string,
): Promise<string> {
  const prompts = await getPrompts();

  const template = prompts["generate-dataroom-user"];

  if (!template || typeof template !== "string") {
    throw new Error("Dataroom user prompt not found in Edge Config");
  }

  return template.replace("{{DESCRIPTION}}", description.trim());
}

