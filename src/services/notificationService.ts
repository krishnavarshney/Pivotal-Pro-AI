import { ToastNotification } from '../utils/types';

type ShowToastOptions = Omit<ToastNotification, 'id'>;

// This allows any part of the application to show a toast message without needing access to React context.
// The `showToast` function is provided by the top-level DashboardProvider.
let showToastFunction: ((options: ShowToastOptions) => void) | null = null;

export const registerShowToast = (fn: (options: ShowToastOptions) => void) => {
    showToastFunction = fn;
};

export const notificationService = {
    show: (options: ShowToastOptions) => {
        if (showToastFunction) {
            showToastFunction(options);
        } else {
            // Fallback for when the UI isn't ready yet or in non-React contexts
            console.warn('Toast provider not registered. Message:', options.message);
        }
    },
    success: (message: string, options?: Partial<Omit<ShowToastOptions, 'message' | 'type'>>) => {
        notificationService.show({ ...options, message, type: 'success' });
    },
    error: (message: string, options?: Partial<Omit<ShowToastOptions, 'message' | 'type'>>) => {
        notificationService.show({ ...options, message, type: 'error' });
    },
    info: (message: string, options?: Partial<Omit<ShowToastOptions, 'message' | 'type'>>) => {
        notificationService.show({ ...options, message, type: 'info' });
    },
    warning: (message: string, options?: Partial<Omit<ShowToastOptions, 'message' | 'type'>>) => {
        notificationService.show({ ...options, message, type: 'warning' });
    },
};