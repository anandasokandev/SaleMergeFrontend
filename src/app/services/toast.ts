import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  show?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private toastIdCounter = 0;

  getToasts() {
    return this.toasts$.asObservable();
  }

  show(type: ToastType, message: string, title?: string, duration: number = 3000): void {
    const toast: Toast = {
      id: this.toastIdCounter++,
      type,
      message,
      title,
      duration,
      show: false
    };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toast]);

    // Trigger animation after a small delay
    setTimeout(() => {
      this.updateToastVisibility(toast.id, true);
    }, 10);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  success(message: string, title: string = 'Success', duration?: number): void {
    this.show(ToastType.SUCCESS, message, title, duration);
  }

  error(message: string, title: string = 'Error', duration?: number): void {
    this.show(ToastType.ERROR, message, title, duration);
  }

  warning(message: string, title: string = 'Warning', duration?: number): void {
    this.show(ToastType.WARNING, message, title, duration);
  }

  info(message: string, title: string = 'Info', duration?: number): void {
    this.show(ToastType.INFO, message, title, duration);
  }

  dismiss(id: number): void {
    // First hide with animation
    this.updateToastVisibility(id, false);
    
    // Then remove from array after animation completes
    setTimeout(() => {
      const currentToasts = this.toasts$.value.filter(t => t.id !== id);
      this.toasts$.next(currentToasts);
    }, 300);
  }

  private updateToastVisibility(id: number, show: boolean): void {
    const currentToasts = this.toasts$.value.map(t => 
      t.id === id ? { ...t, show } : t
    );
    this.toasts$.next(currentToasts);
  }
}
