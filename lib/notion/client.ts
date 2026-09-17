import "server-only";

import { Client } from "@notionhq/client";

export function createNotionClient(): Client {
  const token = process.env.NOTION_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing NOTION_TOKEN");
  }

  return new Client({
    auth: token,
    notionVersion: "2026-03-11",
    timeoutMs: 15_000,
    // Only a sanitized error code is logged by the server loader.
    logger: () => {},
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  });
}
