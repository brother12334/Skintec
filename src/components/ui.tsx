import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SkinTecIcon, type SkinTecIconName } from '../icons/SkinTecIcon';

/* ---------------- Buttons ---------------- */

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'night' | 'secondary' | 'ghost' | 'danger';
  /** The one oversized, wet-thumb button on a screen. */
  huge?: boolean;
  icon?: SkinTecIconName;
  iconAfter?: SkinTecIconName;
  block?: boolean;
  small?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
};

export function Button({
  children,
  onClick,
  variant = 'secondary',
  icon,
  iconAfter,
  block,
  small,
  huge,
  disabled,
  type = 'button',
  ariaLabel,
}: ButtonProps) {
  const classes = [
    'st-btn',
    `st-btn-${variant}`,
    block ? 'st-btn-block' : '',
    small ? 'st-btn-sm' : '',
    huge ? 'st-btn-huge' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {icon ? <SkinTecIcon name={icon} size={small ? 17 : 19} /> : null}
      <span>{children}</span>
      {iconAfter ? <SkinTecIcon name={iconAfter} size={small ? 17 : 19} /> : null}
    </button>
  );
}

export function IconButton({
  name,
  label,
  onClick,
}: {
  name: SkinTecIconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="st-icon-btn" onClick={onClick} aria-label={label} title={label}>
      <SkinTecIcon name={name} size={20} />
    </button>
  );
}

/* ---------------- Switch ---------------- */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="st-switch"
      onClick={() => onChange(!checked)}
    />
  );
}

export function SettingRow({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="st-row">
      <div className="st-row-main">
        <div className="st-row-title">{title}</div>
        {sub ? <div className="st-row-sub">{sub}</div> : null}
      </div>
      {children}
    </div>
  );
}

/* ---------------- Notice ---------------- */

export function Notice({
  children,
  tone = 'plain',
  icon = 'info',
}: {
  children: ReactNode;
  tone?: 'plain' | 'warn' | 'tip';
  icon?: SkinTecIconName;
}) {
  const cls = tone === 'plain' ? 'st-notice' : `st-notice st-notice-${tone}`;
  return (
    <div className={cls}>
      <SkinTecIcon name={icon} size={18} />
      <div>{children}</div>
    </div>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="st-modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="st-modal">
        <div className="st-modal-head">
          <h2 className="st-modal-title">{title}</h2>
          <IconButton name="close" label="Close" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Toasts ---------------- */

type Toast = { id: number; text: string; icon: SkinTecIconName };
const ToastContext = createContext<(text: string, icon?: SkinTecIconName) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, icon: SkinTecIconName = 'completion') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, icon }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="st-toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div className="st-toast" key={t.id}>
            <SkinTecIcon name={t.icon} size={17} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ---------------- Segmented control ---------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; icon?: SkinTecIconName }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div className="st-segment" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon ? <SkinTecIcon name={opt.icon} size={17} /> : null}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Field ---------------- */

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="st-field">
      <label className="st-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="st-hint">{hint}</p> : null}
    </div>
  );
}
