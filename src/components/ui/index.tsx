import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ------------------- SBG BUTTON -------------------
interface SBGButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const SBGButton: React.FC<SBGButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-[#0F5C5B] text-white hover:bg-[#0A4847] shadow-sm hover:shadow focus:ring-[#0F5C5B]',
    secondary: 'bg-[#23827F] text-white hover:bg-[#1C6B68] focus:ring-[#23827F]',
    gold: 'bg-gradient-to-r from-[#D9B76C] to-[#C7A250] text-[#173333] font-semibold hover:from-[#C7A250] hover:to-[#B68F3E] shadow-sm hover:shadow-md focus:ring-[#D9B76C]',
    outline: 'border border-[#DCE5E3] text-[#0F5C5B] hover:bg-[#0F5C5B]/5 focus:ring-[#0F5C5B]',
    glass: 'bg-white/70 backdrop-blur-md border border-white/60 text-[#173333] hover:bg-white/90 shadow-sm focus:ring-[#0F5C5B]',
    danger: 'bg-[#B85C5C] text-white hover:bg-[#9F4848] focus:ring-[#B85C5C]',
    ghost: 'text-[#647777] hover:text-[#173333] hover:bg-black/5 focus:ring-[#0F5C5B]',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// ------------------- SBG INPUT -------------------
interface SBGInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixText?: string;
  containerClassName?: string;
}

export const SBGInput = React.forwardRef<HTMLInputElement, SBGInputProps>(({
  label,
  error,
  helperText,
  prefixIcon,
  suffixText,
  className,
  containerClassName,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-[#647777]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefixIcon && (
          <div className="absolute left-3.5 text-[#647777] pointer-events-none flex items-center">
            {prefixIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl bg-white/80 backdrop-blur-sm border text-sm text-[#173333] placeholder-[#647777]/50 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B]',
            error ? 'border-[#B85C5C] focus:ring-[#B85C5C]/20 focus:border-[#B85C5C]' : 'border-[#DCE5E3] hover:border-[#23827F]/40',
            prefixIcon ? 'pl-10' : 'pl-3.5',
            suffixText ? 'pr-12' : 'pr-3.5',
            'py-2.5',
            className
          )}
          {...props}
        />
        {suffixText && (
          <div className="absolute right-3.5 text-xs font-semibold text-[#647777] pointer-events-none">
            {suffixText}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-[#B85C5C] font-medium">{error}</span>}
      {helperText && !error && <span className="text-xs text-[#647777]">{helperText}</span>}
    </div>
  );
});

SBGInput.displayName = 'SBGInput';

// ------------------- SBG SELECT -------------------
interface SBGSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
  containerClassName?: string;
}

export const SBGSelect = React.forwardRef<HTMLSelectElement, SBGSelectProps>(({
  label,
  error,
  options,
  className,
  containerClassName,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-[#647777]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full rounded-xl bg-white/80 backdrop-blur-sm border text-sm text-[#173333] transition-all duration-200 py-2.5 px-3.5',
          'focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B]',
          error ? 'border-[#B85C5C]' : 'border-[#DCE5E3] hover:border-[#23827F]/40',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-[#B85C5C] font-medium">{error}</span>}
    </div>
  );
});

SBGSelect.displayName = 'SBGSelect';

// ------------------- SBG GLASS CARD -------------------
interface SBGCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'white' | 'teal' | 'gold' | 'subtle';
  hoverEffect?: boolean;
}

export const SBGCard: React.FC<SBGCardProps> = ({
  children,
  variant = 'glass',
  hoverEffect = false,
  className,
  ...props
}) => {
  const variantStyles = {
    glass: 'glass-panel text-[#173333]',
    white: 'bg-white border border-[#DCE5E3] rounded-2xl shadow-sm text-[#173333]',
    teal: 'glass-panel-teal',
    gold: 'glass-panel-gold text-[#173333]',
    subtle: 'glass-panel-subtle text-[#173333]',
  };

  return (
    <div
      className={cn(
        'p-5 transition-all duration-200',
        variantStyles[variant],
        hoverEffect && 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ------------------- SBG BADGE -------------------
interface SBGBadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'gold' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const SBGBadge: React.FC<SBGBadgeProps> = ({
  children,
  variant = 'teal',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    teal: 'teal-badge',
    gold: 'gold-badge',
    success: 'bg-[#3E8B68]/15 text-[#2A6E51] border border-[#3E8B68]/30',
    warning: 'bg-[#C58A3A]/15 text-[#9A641B] border border-[#C58A3A]/30',
    error: 'bg-[#B85C5C]/15 text-[#9E3E3E] border border-[#B85C5C]/30',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium rounded-full',
    md: 'text-xs px-3 py-1 font-semibold rounded-full',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
};

// ------------------- SBG NUMBER FORMATTERS -------------------
export const SBGCurrency: React.FC<{ value: number; className?: string; prefix?: string }> = ({
  value,
  className,
  prefix = '₹',
}) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  const isNegative = value < 0;

  return (
    <span className={cn('font-mono font-semibold', isNegative && 'text-[#B85C5C]', className)}>
      {isNegative && '- '}{prefix} {formatted}
    </span>
  );
};

export const SBGWeight: React.FC<{ value: number; className?: string; unit?: string }> = ({
  value,
  className,
  unit = 'g',
}) => {
  const formatted = (value || 0).toFixed(3);
  const isNegative = value < 0;

  return (
    <span className={cn('font-mono font-medium', isNegative && 'text-[#B85C5C]', className)}>
      {formatted} <span className="text-xs font-normal text-[#647777]">{unit}</span>
    </span>
  );
};

export const SBGRate: React.FC<{ rate: number; unit?: string; className?: string }> = ({
  rate,
  unit = '/g',
  className,
}) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate || 0);

  return (
    <span className={cn('font-mono text-xs font-medium text-[#173333]', className)}>
      ₹{formatted}<span className="text-[#647777]">{unit}</span>
    </span>
  );
};

// ------------------- SBG MODAL -------------------
interface SBGModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const SBGModal: React.FC<SBGModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div
        className={cn(
          'w-full bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col',
          sizeStyles[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE5E3]/80 bg-[#0F5C5B]/5">
          <h3 className="text-lg font-semibold text-[#0F5C5B]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#647777] hover:text-[#173333] hover:bg-black/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
};

export * from './SBGBalanceCard';
export * from './SBGStatCard';

