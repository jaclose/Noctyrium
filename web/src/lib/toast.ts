// Lightweight global toast/notification store. Kept out of the persisted vault —
// toasts are ephemeral UI. Shared by the Pomodoro completion notice, the missed-
// standup alert, and anything else that needs a transient, dismissible message.
import { create } from "zustand";

export type ToastTone = "info" | "success" | "warn";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
  href?: string;        // optional deep-link the action button follows
  actionLabel?: string;
  duration: number;     // ms before auto-dismiss; 0 = sticky
  /** De-dupe key so the same alert isn't stacked repeatedly. */
  dedupe?: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id" | "duration" | "tone"> & { tone?: ToastTone; duration?: number }) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const { dedupe } = toast;
    if (dedupe && get().toasts.some((existing) => existing.dedupe === dedupe)) return;
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 6000;
    set((state) => ({
      toasts: [...state.toasts, { tone: "info", ...toast, id, duration }],
    }));
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export function pushToast(toast: Parameters<ToastStore["push"]>[0]) {
  useToasts.getState().push(toast);
}
