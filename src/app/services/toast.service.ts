import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    const id = this.nextId++;
    this.toasts.update(current => [...current, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  warning(message: string) {
    this.show(message, 'warning');
  }

  /**
   * Compatibility alias for components written against the
   * `addToast(message, type)` signature.
   */
  addToast(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    this.show(message, type);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
