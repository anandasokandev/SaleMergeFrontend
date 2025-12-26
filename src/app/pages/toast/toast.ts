import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService, ToastType, Toast } from '../../services/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  toasts$: Observable<Toast[]>;
  ToastType = ToastType;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.getToasts();
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  getToastClasses(toast: Toast): string {
    const baseClasses = 'flex items-center w-full max-w-sm p-4 mb-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform';
    const visibilityClasses = toast.show 
      ? 'translate-x-0 opacity-100' 
      : 'translate-x-full opacity-0';
    
    let colorClasses = '';
    switch(toast.type) {
      case ToastType.SUCCESS:
        colorClasses = 'bg-white border-l-4 border-green-500';
        break;
      case ToastType.ERROR:
        colorClasses = 'bg-white border-l-4 border-red-500';
        break;
      case ToastType.WARNING:
        colorClasses = 'bg-white border-l-4 border-yellow-500';
        break;
      case ToastType.INFO:
        colorClasses = 'bg-white border-l-4 border-blue-500';
        break;
    }
    
    return `${baseClasses} ${colorClasses} ${visibilityClasses}`;
  }

  getIconBgClasses(type: ToastType): string {
    switch(type) {
      case ToastType.SUCCESS:
        return 'bg-green-100 text-green-500';
      case ToastType.ERROR:
        return 'bg-red-100 text-red-500';
      case ToastType.WARNING:
        return 'bg-yellow-100 text-yellow-500';
      case ToastType.INFO:
        return 'bg-blue-100 text-blue-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }
}
