type QueryPage<T> = {
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
  request_status?: { type: string };
};

export async function collectPages<T>(
  query: (cursor?: string) => Promise<QueryPage<T>>,
): Promise<T[]> {
  const results: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  while (true) {
    const page = await query(cursor);
    if (page.request_status?.type === "incomplete") {
      throw new Error("Notion query result limit reached");
    }
    results.push(...page.results);
    if (!page.has_more) return results;

    // Fail explicitly instead of silently returning a partial archive or looping.
    if (!page.next_cursor || seenCursors.has(page.next_cursor)) {
      throw new Error("Invalid Notion pagination cursor");
    }
    seenCursors.add(page.next_cursor);
    cursor = page.next_cursor;
  }
}
