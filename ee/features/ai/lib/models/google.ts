import { createVertex } from "@ai-sdk/google-vertex";

const vertex = createVertex({
  apiKey: process.env.GOOGLE_VERTEX_API_KEY,
});

export { vertex };
