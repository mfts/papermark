import OpenAI from "openai";

// Create an OpenAI API client (that's edge friendly!)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});
