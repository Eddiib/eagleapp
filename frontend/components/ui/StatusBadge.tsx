import { useBookingStatuses } from '../../context/BookingStatusesContext';

interface StatusBadgeProps {
  status: string | null | undefined;
  /** 'soft' = tinted background (lists); 'solid' = filled background (header). */
  variant?: 'soft' | 'solid';
  /** Layout/sizing classes (padding, text size, rounding shape). Colours come from the configured status. */
  className?: string;
}

// Neutral grey for statuses that aren't configured (e.g. legacy bookings).
export const FALLBACK_COLOR = '#6b7280';

// Pick a readable text colour for a solid badge based on background luminance.
export function readableTextColor(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#ffffff';
}

/**
 * Renders a booking status as a coloured badge using the colour configured in
 * Settings → Booking Statuses. Falls back to neutral grey for unknown statuses.
 */
export function StatusBadge({ status, variant = 'soft', className = '' }: StatusBadgeProps) {
  const { colorFor } = useBookingStatuses();
  const color = (status && colorFor(status)) || FALLBACK_COLOR;
  const label = status || '—';

  const style =
    variant === 'solid'
      ? { backgroundColor: color, color: readableTextColor(color) }
      : { backgroundColor: `${color}22`, color, borderColor: `${color}66` };

  const base = variant === 'solid' ? 'inline-block' : 'inline-block border';

  return (
    <span className={`${base} ${className}`} style={style}>
      {label}
    </span>
  );
}
