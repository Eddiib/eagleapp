// Booking numbers are ESH + a running sequence (e.g. ESH260892). Sorting on
// the numeric part keeps ESH260892 > ESH260864 regardless of created_date
// (the API's default order) and avoids alphabetical pitfalls once the
// sequence gains a digit.

export function bookingNumberSequence(bookingNumber?: string | null): number {
  const match = (bookingNumber || '').trim().match(/^ESH(\d+)$/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

/** Comparator: newest (highest sequence) first; non-ESH numbers sort last, alphabetically. */
export function compareBookingNumbersDesc(a?: string | null, b?: string | null): number {
  return bookingNumberSequence(b) - bookingNumberSequence(a)
    || (b || '').localeCompare(a || '');
}
