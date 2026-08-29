export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(type: ToastType, title: string, description?: string, durationMs = 4000) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, title, description, durationMs };
    this.toasts = [...this.toasts, newToast];
    this.notify();

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  public success(title: string, description?: string) {
    this.show("success", title, description);
  }

  public error(title: string, description?: string) {
    this.show("error", title, description, 6000);
  }

  public info(title: string, description?: string) {
    this.show("info", title, description);
  }

  public warning(title: string, description?: string) {
    this.show("warning", title, description, 5000);
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.toasts);
    }
  }
}

export const toast = new ToastManager();
