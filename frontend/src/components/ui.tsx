'use client';

import React from 'react';

/* Shared BridgeAI primitives. Keep screens composed from these so spacing,
   radius and colour stay consistent. */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'jade';
type ButtonSize = 'md' | 'lg' | 'sm';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft',
  jade: 'bg-jade text-white hover:bg-[#086a50]',
  secondary: 'bg-surface text-ink shadow-card hover:bg-paper',
  ghost: 'text-ink hover:bg-ink/5',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 text-[13px] rounded-lg',
  md: 'min-h-[44px] px-4 text-sm rounded-xl',
  lg: 'min-h-[52px] px-5 text-[15px] rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  block,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export type ChipTone = 'neutral' | 'jade' | 'amber' | 'risk' | 'ai' | 'ink';

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: 'bg-ink/[0.06] text-muted',
  jade: 'bg-jade-wash text-jade',
  amber: 'bg-amber-wash text-amber-ink',
  risk: 'bg-risk-wash text-risk',
  ai: 'bg-ai-wash text-ai',
  ink: 'bg-ink text-white',
};

export function Chip({
  tone = 'neutral',
  icon,
  title,
  className = '',
  children,
}: {
  tone?: ChipTone;
  icon?: React.ReactNode;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${CHIP_TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function Panel({
  as: Tag = 'section',
  className = '',
  children,
  ...rest
}: {
  as?: 'section' | 'article' | 'div';
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`rounded-2xl bg-surface p-4 shadow-card sm:p-5 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  level = 2,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  level?: 2 | 3;
}) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <H className={level === 2 ? 'text-lg font-bold text-ink' : 'text-base font-bold text-ink'}>
          {title}
        </H>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex w-full rounded-xl bg-ink/[0.06] p-1 sm:w-auto">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`min-h-[40px] flex-1 rounded-lg px-4 text-sm font-semibold transition-colors sm:flex-none cursor-pointer ${
              active ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const COUNTRY_CODES: Record<string, string> = {
  malaysia: 'MY',
  indonesia: 'ID',
  singapore: 'SG',
  thailand: 'TH',
  vietnam: 'VN',
  philippines: 'PH',
  brunei: 'BN',
  cambodia: 'KH',
  laos: 'LA',
  myanmar: 'MM',
};

export function countryCode(country?: string | null, fallback = '—'): string {
  if (!country) return fallback;
  const trimmed = country.trim();
  return COUNTRY_CODES[trimmed.toLowerCase()] ?? trimmed.slice(0, 2).toUpperCase();
}

/* Signature element: a boarding-pass style route between two countries. */
export function RouteRibbon({
  from,
  to,
  size = 'md',
  tone = 'light',
}: {
  from?: string | null;
  to?: string | null;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark';
}) {
  const code = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-base' : 'text-xs';
  const line = size === 'lg' ? 'w-16 sm:w-24' : size === 'md' ? 'w-8' : 'w-5';
  const ink = tone === 'dark' ? 'text-white' : 'text-ink';
  const rule = tone === 'dark' ? 'border-white/40' : 'border-ink/25';
  return (
    <span
      className={`inline-flex items-center gap-2 font-extrabold tracking-wide ${ink} ${code}`}
      aria-label={`${from ?? 'Home country'} to ${to ?? 'target country'}`}
    >
      <span>{countryCode(from)}</span>
      <span aria-hidden="true" className="relative inline-flex items-center">
        <span className={`${line} border-t-2 border-dashed ${rule}`} />
        <span className="absolute -right-0.5 h-1.5 w-1.5 rounded-full bg-jade-bright" />
      </span>
      <span>{countryCode(to)}</span>
    </span>
  );
}

/* Horizontal fit meter. The label explicitly says it is a fit score, not a funding probability. */
export function FitMeter({ score, compact = false }: { score: number; compact?: boolean }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone = clamped >= 75 ? 'bg-jade-bright' : clamped >= 55 ? 'bg-[#E0A526]' : 'bg-muted/50';
  return (
    <div className={compact ? 'w-24' : 'w-full'}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`tabular font-extrabold text-ink ${compact ? 'text-base' : 'text-2xl'}`}>
          {clamped}
          <span className="text-xs font-semibold text-muted">/100</span>
        </span>
        {compact ? null : <span className="text-xs font-medium text-muted">Fit score</span>}
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-ink/20 bg-surface/60 p-6">
      {icon ? <div className="text-muted">{icon}</div> : null}
      <div>
        <p className="text-base font-bold text-ink">{title}</p>
        {body ? <p className="mt-1 max-w-prose text-sm text-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* A visible-but-quiet back link for sub-screens. */
export function BackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-2 inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-muted hover:text-ink cursor-pointer"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </button>
  );
}

/* Bottom sheet on mobile, centred dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-toast-in relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface shadow-float outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink cursor-pointer"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{footer}</div> : null}
      </div>
    </div>
  );
}

/* Toggle chip used inside filter groups. */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors cursor-pointer ${
        active ? 'bg-ink text-white' : 'bg-paper text-ink hover:bg-ink/10'
      }`}
    >
      {children}
    </button>
  );
}

export const inputClass =
  'min-h-[44px] w-full rounded-xl border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted/70 focus:border-jade focus:outline-none focus:ring-2 focus:ring-jade/20';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function formatMoneyRange(range?: { min?: number; max?: number; currency: string } | null): string | null {
  if (!range || (!range.min && !range.max)) return null;
  const k = (n?: number) => (n ? `${Math.round(n / 1000)}k` : '?');
  return `${range.currency} ${k(range.min)}–${k(range.max)}`;
}
