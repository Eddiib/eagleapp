import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

type Tone = 'danger' | 'default';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

interface ConfirmState extends Required<Pick<ConfirmOptions, 'title' | 'message' | 'confirmLabel' | 'cancelLabel' | 'tone'>> {
  open: boolean;
}

type Resolver = (result: boolean) => void;

const DEFAULTS: ConfirmState = {
  open: false,
  title: 'Please confirm',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'default',
};

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(DEFAULTS);
  const resolverRef = useRef<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({
        open: true,
        title: opts.title ?? 'Please confirm',
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? (opts.tone === 'danger' ? 'Delete' : 'Confirm'),
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        tone: opts.tone ?? 'default',
      });
    });
  }, []);

  const finish = (result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
    if (resolve) resolve(result);
  };

  const confirmBtnCls = state.tone === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
          onClick={() => finish(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3 mb-4">
              {state.tone === 'danger' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {state.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {state.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => finish(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={() => finish(true)}
                className={`px-4 py-2 text-sm rounded-lg text-white transition-colors ${confirmBtnCls}`}
                autoFocus
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmDialogProvider');
  return ctx;
}
