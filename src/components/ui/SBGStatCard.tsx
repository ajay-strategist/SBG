import React from 'react';
import { cn } from './index';

interface SBGStatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'glass' | 'teal' | 'gold' | 'white';
  className?: string;
  onClick?: () => void;
}

export const SBGStatCard: React.FC<SBGStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'glass',
  className,
  onClick,
}) => {
  const isTeal = variant === 'teal';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all duration-200 border',
        variant === 'teal' && 'glass-panel-teal',
        variant === 'gold' && 'glass-panel-gold',
        variant === 'glass' && 'glass-panel hover:shadow-md',
        variant === 'white' && 'bg-white border-[#DCE5E3] shadow-sm',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              isTeal ? 'text-[#D9B76C]' : 'text-[#647777]'
            )}
          >
            {title}
          </span>
          <div
            className={cn(
              'text-2xl lg:text-3xl font-bold tracking-tight',
              isTeal ? 'text-white' : 'text-[#173333]'
            )}
          >
            {value}
          </div>
          {subtitle && (
            <p
              className={cn(
                'text-xs',
                isTeal ? 'text-white/70' : 'text-[#647777]'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            'p-3 rounded-xl flex items-center justify-center flex-shrink-0',
            isTeal
              ? 'bg-white/10 text-[#D9B76C]'
              : 'bg-[#0F5C5B]/10 text-[#0F5C5B]'
          )}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-black/5 flex items-center text-xs font-semibold">
          <span
            className={
              trend.isPositive ? 'text-[#3E8B68]' : 'text-[#B85C5C]'
            }
          >
            {trend.value}
          </span>
          <span className="text-[#647777] ml-1.5 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
};
