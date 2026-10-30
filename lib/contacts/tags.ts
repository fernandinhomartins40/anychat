export const MAX_TAG_LENGTH = 40;
export const MAX_TAGS_PER_CAMPAIGN = 10;

/**
 * Tags are matched case-insensitively, so "Lead" and "lead " must not become
 * two tags. Store them trimmed, single-spaced and lowercase.
 */
export function normalizeTagName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase().slice(0, MAX_TAG_LENGTH);
}

/** Normalizes, drops blanks and duplicates, keeping first-seen order. */
export function normalizeTagList(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const value of raw) {
    const name = normalizeTagName(value);
    if (name) seen.add(name);
  }
  return [...seen];
}
