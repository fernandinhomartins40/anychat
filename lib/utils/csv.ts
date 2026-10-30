/**
 * Minimal CSV parser for the campaign importer.
 *
 * Handles quoted fields, commas and newlines inside quotes, and escaped
 * quotes (""). Returns one object per data row, keyed by the lowercased,
 * trimmed header names. Blank lines are skipped.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseRows(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const out: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    // Skip a fully empty line.
    if (cells.length === 1 && cells[0].trim() === "") continue;

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? "").trim();
    });
    out.push(record);
  }

  return out;
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Flush the last field and row if the file did not end with a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Pull the shortcode out of an Instagram post or reel URL so a pasted link
 * can be matched against a media item's permalink. Returns null if the value
 * does not look like an Instagram post URL.
 */
export function instagramShortcode(value: string): string | null {
  const match = value.match(/instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Serializes rows to CSV. Every cell is quoted, and a cell that a spreadsheet
 * would run as a formula (=, +, -, @, tab, CR) gets a leading apostrophe,
 * since exported values such as usernames come from strangers.
 */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | null | undefined)[])[]): string {
  const cell = (value: string | null | undefined) => {
    let text = value ?? "";
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
