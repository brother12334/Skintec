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
  disabled,
  type = 'button',
  ariaLabel,
}: ButtonProps) {
  const classes = [
    'st-btn',
    `st-btn-${variant}`,
    block ? 'st-btn-block' : '',
    small ? 'st-btn-sm' : '',
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

/* ---------------- Badge ---------------- */

export function Badge({
  children,
  tone = 'neutral',
  icon,
}: {
  children: ReactNode;
  tone?: 'sun' | 'night' | 'treat' | 'recovery' | 'neutral';
  icon?: SkinTecIconName;
}) {
  return (
    <span className={`st-badge st-badge-${tone}`}>
      {icon ? <SkinTecIcon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}

/* ---------------- Progress ---------------- */

export function ProgressBar({
  value,
  total,
  night,
  label,
}: {
  value: number;
  total: number;
  night?: boolean;
  label?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="st-progress">
      <div
        className="st-progress-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? 'Routine progress'}
      >
        <div className={`st-progress-fill${night ? ' is-night' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="st-progress-label">
        {value} / {total}
      </span>
    </div>
  );
}

export function ProgressRing({
  value,
  total,
  size = 56,
  night,
}: {
  value: number;
  total: number;
  size?: number;
  night?: boolean;
}) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <svg className="st-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--st-track)" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={night ? 'var(--st-sky-500)' : 'var(--st-yellow-400)'}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
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
  tone = 'calm',
  icon = 'info',
}: {
  children: ReactNode;
  tone?: 'calm' | 'warn' | 'good' | 'plain';
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
