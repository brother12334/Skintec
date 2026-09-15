/**
 * The SkinTec icon system.
 *
 * One drawing language: 24×24 grid, 1.7 stroke, round caps and joins, rounded
 * geometry, no fills except deliberate accents. No Unicode or system emoji is
 * used anywhere in SkinTec — every symbol in the product comes from this file.
 */

export type SkinTecIconName =
  | 'morning'
  | 'night'
  | 'cleanser'
  | 'moisturizer'
  | 'tretinoin'
  | 'retinol'
  | 'mask'
  | 'recovery'
  | 'sunscreen'
  | 'serum'
  | 'wait'
  | 'checkin'
  | 'calendar'
  | 'progress'
  | 'products'
  | 'settings'
  | 'completion'
  | 'warning'
  | 'compatibility'
  | 'add'
  | 'edit'
  | 'delete'
  | 'back'
  | 'forward'
  | 'start'
  | 'close'
  | 'pause'
  | 'info'
  | 'today';

type Props = {
  name: SkinTecIconName;
  size?: number;
  /** Accessible label. Omit for decorative icons — they are hidden from readers. */
  title?: string;
  className?: string;
  strokeWidth?: number;
};

const paths: Record<SkinTecIconName, JSX.Element> = {
  morning: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3.3v1.8M12 18.9v1.8M3.3 12h1.8M18.9 12h1.8M5.9 5.9l1.3 1.3M16.8 16.8l1.3 1.3M18.1 5.9l-1.3 1.3M7.2 16.8l-1.3 1.3" />
    </>
  ),
  night: <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4Z" />,
  cleanser: (
    <>
      <path d="M10 3.6h4v2.2h-4z" />
      <path d="M8.8 5.8h6.4a2.6 2.6 0 0 1 2.6 2.6v9.6a2.6 2.6 0 0 1-2.6 2.6H8.8a2.6 2.6 0 0 1-2.6-2.6V8.4a2.6 2.6 0 0 1 2.6-2.6Z" />
      <path d="M9.2 11.4h5.6" />
    </>
  ),
  moisturizer: (
    <>
      <path d="M6.4 9.4h11.2a2 2 0 0 1 2 2v6.4a2.6 2.6 0 0 1-2.6 2.6H7a2.6 2.6 0 0 1-2.6-2.6v-6.4a2 2 0 0 1 2-2Z" />
      <path d="M8.2 9.4V6.8a2.4 2.4 0 0 1 2.4-2.4h2.8a2.4 2.4 0 0 1 2.4 2.4v2.6" />
      <path d="M9 14.6h6" />
    </>
  ),
  tretinoin: (
    <>
      <path d="M9.4 3.8h5.2v2.4H9.4z" />
      <path d="M9.4 6.2h5.2v11.4a2.6 2.6 0 0 1-2.6 2.6h0a2.6 2.6 0 0 1-2.6-2.6Z" />
      <path d="M12 10v4.2M9.9 12.1h4.2" />
    </>
  ),
  retinol: (
    <>
      <path d="M12 3.6c3.3 3.7 5.4 6.4 5.4 9a5.4 5.4 0 0 1-10.8 0c0-2.6 2.1-5.3 5.4-9Z" />
      <path d="M9.6 12.9a2.4 2.4 0 0 0 2.4 2.4" />
    </>
  ),
  mask: (
    <>
      <path d="M12 3.8c3.9 0 6.6 1.2 6.6 3.2 0 1.4-.5 4-1.3 6.6-1 3.3-2.8 6.6-5.3 6.6s-4.3-3.3-5.3-6.6C5.9 11 5.4 8.4 5.4 7c0-2 2.7-3.2 6.6-3.2Z" />
      <path d="M9 10.2h1.6M13.4 10.2H15M10.6 14.6h2.8" />
    </>
  ),
  recovery: (
    <>
      <path d="M12 20.2s-6.6-3.6-6.6-8.6A3.8 3.8 0 0 1 12 9.1a3.8 3.8 0 0 1 6.6 2.5c0 5-6.6 8.6-6.6 8.6Z" />
      <path d="M12 9.1V4.4" />
    </>
  ),
  sunscreen: (
    <>
      <path d="M12 3.6 19 6v5.6c0 4.2-2.9 7-7 8.8-4.1-1.8-7-4.6-7-8.8V6Z" />
      <circle cx="12" cy="11.6" r="2.2" />
      <path d="M12 7.6v.9M12 14.7v.9M8.4 11.6h.9M14.7 11.6h.9" />
    </>
  ),
  serum: (
    <>
      <path d="M10.2 3.8h3.6v3l2.4 3.6v7.2a2.6 2.6 0 0 1-2.6 2.6h-3.2a2.6 2.6 0 0 1-2.6-2.6v-7.2l2.4-3.6Z" />
      <path d="M9.2 13.4h5.6" />
    </>
  ),
  wait: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6V12l2.8 1.8" />
    </>
  ),
  checkin: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M7.8 12.4h2.1l1.3-2.4 1.6 4.2 1.1-1.8h2.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.8" y="5.4" width="16.4" height="14.4" rx="3.2" />
      <path d="M3.8 10h16.4M8.4 3.6v3.4M15.6 3.6v3.4" />
    </>
  ),
  progress: (
    <>
      <path d="M4.6 19.4h14.8" />
      <path d="M7.6 19.4v-4.2M12 19.4V9.8M16.4 19.4V5.4" />
    </>
  ),
  products: (
    <>
      <rect x="3.6" y="8.6" width="7" height="11.6" rx="2.4" />
      <rect x="13.4" y="4.6" width="7" height="15.6" rx="2.4" />
      <path d="M5.4 5.6h3.4v3M15.2 12.4h3.4" />
    </>
  ),
  settings: (
    <>
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2.4" />
      <circle cx="10" cy="16" r="2.4" />
    </>
  ),
  completion: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.4 12.3l2.5 2.5 4.7-5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4.4 20.4 19H3.6Z" />
      <path d="M12 10.2v3.6M12 16.6h.01" />
    </>
  ),
  compatibility: (
    <>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </>
  ),
  add: <path d="M12 5.4v13.2M5.4 12h13.2" />,
  edit: (
    <>
      <path d="M16.4 4.6a2.3 2.3 0 0 1 3.2 3.2L9.2 18.2l-4.2 1 1-4.2Z" />
      <path d="M14.6 6.4l3 3" />
    </>
  ),
  delete: (
    <>
      <path d="M4.8 7h14.4M9.4 7V5.4a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6V7" />
      <path d="M6.8 7l.9 11.2a2.2 2.2 0 0 0 2.2 2h4.2a2.2 2.2 0 0 0 2.2-2L17.2 7" />
      <path d="M10.4 11v5.4M13.6 11v5.4" />
    </>
  ),
  back: <path d="M14.6 5.4 8 12l6.6 6.6" />,
  forward: <path d="M9.4 5.4 16 12l-6.6 6.6" />,
  start: <path d="M8.4 5.6 18 12l-9.6 6.4Z" />,
  close: <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />,
  pause: <path d="M9.4 5.6v12.8M14.6 5.6v12.8" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11.2v5M12 7.9h.01" />
    </>
  ),
  today: (
    <>
      <rect x="3.8" y="5.4" width="16.4" height="14.4" rx="3.2" />
      <path d="M3.8 10h16.4M8.4 3.6v3.4M15.6 3.6v3.4" />
      <circle cx="12" cy="14.6" r="2" />
    </>
  ),
};

export function SkinTecIcon({ name, size = 22, title, className, strokeWidth = 1.7 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}

/** The SkinTec mark: a sheet mask on the warm SkinTec tile. */
export function SkinTecMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="st-mark-grad" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#FFE08C" />
          <stop offset="0.55" stopColor="#FFC061" />
          <stop offset="1" stopColor="#FFA97A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#st-mark-grad)" />
      <path
        fill="#FFFDF8"
        fillRule="evenodd"
        d="M32 9.4c10.9 0 18.4 3.5 18.4 9.2 0 4.1-1.4 11.3-3.8 18.5C43.9 46.4 38.9 55 32 55s-11.9-8.6-14.6-17.9C15 29.9 13.6 22.7 13.6 18.6c0-5.7 7.5-9.2 18.4-9.2Z M17.9 28.4a5 2.8 0 1 0 10 0a5 2.8 0 1 0-10 0Z M36.1 28.4a5 2.8 0 1 0 10 0a5 2.8 0 1 0-10 0Z M26.2 42.6a5.8 2.7 0 1 0 11.6 0a5.8 2.7 0 1 0-11.6 0Z"
      />
    </svg>
  );
}

export const STEP_ICON: Record<string, SkinTecIconName> = {
  cleanser: 'cleanser',
  moisturizer: 'moisturizer',
  tretinoin: 'tretinoin',
  retinol: 'retinol',
  mask: 'mask',
  sunscreen: 'sunscreen',
  serum: 'serum',
  wait: 'wait',
};
