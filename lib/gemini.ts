import { GoogleGenAI } from "@google/genai";

// A fast, low-cost model; the one place to change it
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

// AI_DISABLED=true (e.g. in .env.local) makes callers use mock data instead of calling Gemini
export function isAiDisabled(): boolean {
  const value = process.env.AI_DISABLED?.trim().toLowerCase();
  return value === "true" || value === "1";
}

let client: GoogleGenAI | null = null;

// Created on first use, so builds and tests don't need the key. Server-only: the key is never
// sent to the browser.
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// Asks Gemini for JSON matching the given response schema and returns the parsed value, which the
// caller must still validate (e.g. with zod) before trusting it.
export async function generateJson(prompt: string, responseJsonSchema: object): Promise<unknown> {
  const response = await getClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", responseJsonSchema },
  });
  if (!response.text) throw new Error("Empty response from Gemini");
  return JSON.parse(response.text);
}
