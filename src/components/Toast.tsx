import React from 'react';
import { useToast, ToastMessage } from '../contexts/ToastContext';

const icons: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

const borderColors: Record<string, string> = {
  success: 'border-green-600',
  error: 'border-red-600',
  info: 'border-outline-variant',
};

const iconColors: Record<string, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-primary',
};

const SingleToast: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const { dismissToast } = useToast();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 w-full max-w-sm bg-[#111111] border ${borderColors[toast.type]} p-4 shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300`}
    >
      <span className={`material-symbols-outlined shrink-0 ${iconColors[toast.type]}`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label-md text-label-md font-bold text-white">{toast.title}</p>
        {toast.message && (
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 break-words">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-on-surface-variant hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};

const Toast: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 right-4 md:right-6 z-[200] flex flex-col gap-2 items-end"
    >
      {toasts.map((t) => (
        <SingleToast key={t.id} toast={t} />
      ))}
    </div>
  );
};

export default Toast;
