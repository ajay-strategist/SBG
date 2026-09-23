import React from 'react';
import { SBGCurrency, SBGWeight } from './index';
import { Scale, Wallet } from 'lucide-react';

interface SBGBalanceCardProps {
  pureWT: number;
  mcBalance: number;
  title?: string;
  subtitle?: string;
  variant?: 'glass' | 'teal' | 'gold';
  className?: string;
}

export const SBGBalanceCard: React.FC<SBGBalanceCardProps> = ({
  pureWT,
  mcBalance,
  title = 'CURRENT COMMERCIAL BALANCE',
  subtitle,
  variant = 'glass',
  className,
}) => {
  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 ${
        variant === 'teal'
          ? 'glass-panel-teal'
          : variant === 'gold'
          ? 'glass-panel-gold'
          : 'glass-panel'
      } ${className || ''}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
        <div>
          <h4
            className={`text-xs font-bold tracking-wider uppercase ${
              variant === 'teal' ? 'text-[#D9B76C]' : 'text-[#0F5C5B]'
            }`}
          >
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-[#647777] mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-black/5 text-[#0F5C5B]">
          Live Ledger
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pure WT Balance */}
        <div className="bg-white/60 dark:bg-black/10 rounded-xl p-3.5 border border-white/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#0F5C5B]/10 text-[#0F5C5B] flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#647777] uppercase tracking-wider block">
              Pure Gold Balance
            </span>
            <div className="text-xl font-bold text-[#173333] tracking-tight">
              <SBGWeight value={pureWT} />
            </div>
          </div>
        </div>

        {/* MC Currency Balance */}
        <div className="bg-white/60 dark:bg-black/10 rounded-xl p-3.5 border border-white/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#D9B76C]/20 text-[#9A641B] flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#647777] uppercase tracking-wider block">
              Making Charge Balance
            </span>
            <div className="text-xl font-bold text-[#173333] tracking-tight">
              <SBGCurrency value={mcBalance} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
