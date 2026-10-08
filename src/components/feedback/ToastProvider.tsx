/* Notifications éphémères (toasts), annoncées aux lecteurs d'écran. */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { announce } from '../../lib/announce';
import { Icon } from '../icons/Icon';

export type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant?: ToastVariant;
}

type ToastFn = (message: string, variant?: ToastVariant) => void;

const ToastContext = createContext<ToastFn>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback<ToastFn>((message, variant) => {
    counter.current += 1;
    const id = counter.current;
    setItems((list) => [...list, { id, message, variant }]);
    announce(message);
    window.setTimeout(() => {
      setItems((list) => list.filter((item) => item.id !== id));
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-root" role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={item.variant ? `toast toast-${item.variant}` : 'toast'}>
            <Icon name={item.variant === 'error' ? 'alert' : 'checkCircle'} size={18} />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  return useContext(ToastContext);
}
