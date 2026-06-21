// Renders the global toast stack (bottom-right). Mounted once at the app root.
import { CheckCircle2, Info, AlertTriangle, X, ArrowRight } from "lucide-react";
import { useToasts } from "../../lib/toast";

const ICON = {
  success: CheckCircle2,
  warn: AlertTriangle,
  info: Info,
} as const;

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = ICON[toast.tone];
        return (
          <div className={`toast toast-${toast.tone}`} key={toast.id} role="status">
            <span className="toast-icon"><Icon size={17} /></span>
            <div className="toast-body">
              <b>{toast.title}</b>
              {toast.body && <span>{toast.body}</span>}
              {toast.href && toast.actionLabel && (
                <a className="toast-action" href={toast.href} onClick={() => dismiss(toast.id)}>
                  {toast.actionLabel} <ArrowRight size={13} />
                </a>
              )}
            </div>
            <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
