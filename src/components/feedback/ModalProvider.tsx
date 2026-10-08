/* =====================================================================
   Modales accessibles
   ---------------------------------------------------------------------
   - rendues dans un portail sur <body> ;
   - focus placé sur la fenêtre, piégé à l'intérieur, restitué à la
     fermeture ; fermeture par Échap, par le bouton ou par clic hors cadre ;
   - confirm() renvoie une promesse booléenne.
   Les formulaires complexes (éditeurs d'administration) passent leur
   propre composant en `body` et gèrent eux-mêmes leur pied de fenêtre.
   ===================================================================== */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/I18nContext';
import { Icon } from '../icons/Icon';

export interface ModalOptions {
  title: string;
  body: ReactNode;
  footer?: ReactNode;
  size?: 'lg';
}

export interface ConfirmOptions {
  title?: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ModalApi {
  open: (options: ModalOptions) => void;
  close: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalApi | null>(null);

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function ModalFrame({ options, onClose }: { options: ModalOptions; onClose: () => void }) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('[data-modal-close]')?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={options.size === 'lg' ? 'modal modal-lg' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-label={options.title}
      >
        <div className="modal-head">
          <h3>{options.title}</h3>
          <button
            type="button"
            className="icon-btn"
            data-modal-close
            onClick={onClose}
            aria-label={t('common.actions.close')}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{options.body}</div>
        {options.footer ? <div className="modal-foot">{options.footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState<ModalOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback(() => {
    if (resolver.current) {
      resolver.current(false);
      resolver.current = null;
    }
    setCurrent(null);
  }, []);

  const open = useCallback((options: ModalOptions) => {
    setCurrent(options);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        const settle = (value: boolean) => {
          resolver.current = null;
          setCurrent(null);
          resolve(value);
        };
        setCurrent({
          title: options.title ?? t('common.actions.confirm'),
          body: <p>{options.body}</p>,
          footer: (
            <>
              <button type="button" className="btn btn-outline" onClick={() => settle(false)}>
                {t('common.actions.cancel')}
              </button>
              <button
                type="button"
                className={options.danger ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={() => settle(true)}
              >
                {options.confirmLabel ?? t('common.actions.confirm')}
              </button>
            </>
          )
        });
      }),
    [t]
  );

  const api = useMemo<ModalApi>(() => ({ open, close, confirm }), [open, close, confirm]);

  return (
    <ModalContext.Provider value={api}>
      {children}
      {current ? <ModalFrame options={current} onClose={close} /> : null}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalApi {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal doit être utilisé sous <ModalProvider>.');
  return ctx;
}
