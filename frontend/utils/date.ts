// App-wide date display format: dd/mm/yyyy.
// Accepts 'YYYY-MM-DD' strings (what the API returns for DATE columns),
// ISO datetime strings, or Date objects. Returns the fallback for
// empty/invalid input. Never use this for <input type="date"> values —
// those must stay 'YYYY-MM-DD'.

export function formatDate(value?: string | Date | null, fallback = '—'): string {
  if (!value) return fallback;
  let y: number, m: number, d: number;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return fallback;
    y = value.getFullYear(); m = value.getMonth() + 1; d = value.getDate();
  } else {
    // Parse the date part textually so 'YYYY-MM-DD' and ISO datetimes render
    // the stored calendar date without any timezone shifting.
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      y = Number(match[1]); m = Number(match[2]); d = Number(match[3]);
    } else {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) return fallback;
      y = parsed.getFullYear(); m = parsed.getMonth() + 1; d = parsed.getDate();
    }
  }
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${dd}/${mm}/${y}`;
}
