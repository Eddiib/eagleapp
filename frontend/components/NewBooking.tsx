import { AlertTriangle } from 'lucide-react';

interface NewBookingProps {
  onSave: (bookingId: string) => void;
  onCancel: () => void;
  prefillData?: any;
}

// Legacy compatibility wrapper. Booking creation now lives in the shared
// booking workspace inside App.tsx so this component cannot diverge into a
// second standalone create flow again.
export function NewBooking({ onCancel }: NewBookingProps) {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-lg">Legacy booking create screen retired</h2>
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Booking creation now uses the shared booking shell so the create, edit,
          and view flows stay on one contract and one layout. Use the main
          booking workspace instead of this legacy component.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm transition-colors hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
