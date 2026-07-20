// Dependency-free CSV utilities. CSV files open directly in Excel / Google
// Sheets, so admins can bulk-edit products in a spreadsheet and upload them
// back. Handles RFC-4180 style quoting (commas, quotes and newlines inside
// quoted fields).

/** Split raw CSV text into rows of string cells. */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell); cell = '';
    } else if (c === '\n') {
      row.push(cell); rows.push(row); row = []; cell = '';
    } else {
      cell += c;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

/** Parse CSV text into row objects keyed by the (trimmed, lower-cased) header row. */
export function parseCSV(text: string): Record<string, string>[] {
  const rows = parseRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 1 && cells[0].trim() === '') continue; // blank line
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (cells[idx] ?? '').trim(); });
    out.push(obj);
  }
  return out;
}

/** Escape a single CSV field. */
function escapeCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build CSV text from a header list + row objects. */
export function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const head = headers.map(escapeCell).join(',');
  const body = rows.map(r => headers.map(h => escapeCell(r[h])).join(',')).join('\n');
  return body ? `${head}\n${body}` : head;
}

/** Trigger a browser download of CSV text (with a UTF-8 BOM so Excel is happy). */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
