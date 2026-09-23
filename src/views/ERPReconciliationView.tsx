import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  ExternalLink,
  ShieldAlert,
  Gem,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';
import { SBGModal, SBGInput, SBGButton } from '../components/ui';

interface ERPReconciliationViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const ERPReconciliationView: React.FC<ERPReconciliationViewProps> = ({ onNavigate }) => {
  const { erpSyncItems, resolveDiscrepancy } = useSBG();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const matchedCount = erpSyncItems.filter((i) => i.status === 'MATCHED').length;
  const discrepancyCount = erpSyncItems.filter((i) => i.status === 'DISCREPANCY').length;

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !resolutionNotes) return;
    resolveDiscrepancy(selectedItem.id, resolutionNotes);
    setSelectedItem(null);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Luxury Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6 text-[#0F5C5B]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
                ERP Commercial Reconciliation Layer
              </h1>
              <p className="text-xs text-[#526B6A] mt-1 font-medium">
                Compare ERP manufacturing stock-out entries with SBG commercial ledger records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right hidden md:block border-l-2 sm:border-l-0 sm:border-r-2 border-[#D9B76C]/40 pl-3 sm:pl-0 sm:pr-4">
              <span className="text-xs text-[#526B6A] block font-medium">Sync Status</span>
              <span className="text-xs font-bold text-[#1A825B] block">Operational</span>
            </div>

            <span className="text-xs font-mono font-bold text-[#0F5C5B] bg-[#E1F5F3] px-3.5 py-2 rounded-2xl border border-[#0F5C5B]/20 shadow-2xs">
              Live Bridge Active
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs">
          <span className="text-[11px] uppercase font-bold text-[#4B6B68] block">TOTAL SYNCED VOUCHERS</span>
          <div className="text-3xl font-bold text-[#133837] mt-2">{erpSyncItems.length}</div>
          <span className="text-xs text-[#647777] mt-1 block">Commercial records</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs">
          <span className="text-[11px] uppercase font-bold text-[#1A825B] block">MATCHED & RECONCILED</span>
          <div className="text-3xl font-bold text-[#1A825B] mt-2">{matchedCount}</div>
          <span className="text-xs text-[#1A825B] font-medium mt-1 block">100% Weight & MC match</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs">
          <span className="text-[11px] uppercase font-bold text-[#B87B1D] block">DISCREPANCIES FLAGGED</span>
          <div className="text-3xl font-bold text-[#C24141] mt-2">{discrepancyCount}</div>
          <span className="text-xs text-[#B87B1D] font-medium mt-1 block">Requires confirmation</span>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md overflow-hidden">
        <div className="p-4 bg-[#FAF9F6] border-b border-[#E2E8E6] flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#143B39]">
            Commercial Reconciliation Queue (ERP ↔ SBG System)
          </h3>
          <span className="text-xs text-[#647777] font-medium">Strict Non-Manufacturing Sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px] tracking-wider bg-[#FAF9F6]">
              <tr>
                <th className="py-3.5 px-4">ERP STOCK-OUT REF</th>
                <th className="py-3.5 px-4">SBG ORDER REF</th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4 text-right">ERP GROSS WT</th>
                <th className="py-3.5 px-4 text-right">SBG GROSS WT</th>
                <th className="py-3.5 px-4 text-right">ERP MC (₹)</th>
                <th className="py-3.5 px-4 text-right">SBG MC (₹)</th>
                <th className="py-3.5 px-4 text-center">RECON STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {erpSyncItems.map((item) => {
                const isDiscrepancy = item.status === 'DISCREPANCY';

                return (
                  <tr key={item.id} className={isDiscrepancy ? 'bg-[#FEF5E6]/30' : 'hover:bg-[#FAF8F5]'}>
                    <td className="py-4 px-4 font-mono font-bold text-[#0F5C5B]">
                      {item.erpRef}
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold">
                      {item.sbgRef || <span className="text-[#647777] italic">Pending Link</span>}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#173333]">
                      {item.customerName}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-medium">
                      {item.erpGrossWT.toFixed(3)} g
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-medium text-[#0F5C5B] font-bold">
                      {item.sbgGrossWT.toFixed(3)} g
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      ₹ {item.erpMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      ₹ {item.sbgMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.status === 'MATCHED'
                            ? 'bg-[#E6F8F2] text-[#1A825B]'
                            : 'bg-[#FEECEC] text-[#C24141]'
                        }`}
                      >
                        {item.status === 'MATCHED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {isDiscrepancy ? (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setResolutionNotes(item.discrepancyReason || '');
                          }}
                          className="px-3 py-1 rounded-xl bg-[#E5C378] hover:bg-[#D9B76C] text-[#3D2D0C] font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          Resolve Delta
                        </button>
                      ) : (
                        <span className="text-xs text-[#1A825B] font-semibold">Verified</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Resolution Modal */}
      {selectedItem && (
        <SBGModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Resolve ERP Discrepancy: ${selectedItem.erpRef}`}
          size="md"
        >
          <form onSubmit={handleResolve} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#FEECEC] border border-[#F5C2C2] text-xs text-[#A33E3E] space-y-1">
              <strong className="block font-bold">Detected Variance:</strong>
              <p>{selectedItem.discrepancyReason || 'Weight or Making charge difference detected between ERP and SBG records.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#EFECE6]">
              <div>
                <span className="text-[#647777] block uppercase text-[10px]">ERP Gross WT</span>
                <span className="font-bold text-sm">{selectedItem.erpGrossWT.toFixed(3)} g</span>
              </div>
              <div>
                <span className="text-[#647777] block uppercase text-[10px]">SBG Gross WT</span>
                <span className="font-bold text-sm text-[#0F5C5B]">{selectedItem.sbgGrossWT.toFixed(3)} g</span>
              </div>
            </div>

            <SBGInput
              label="Audit Resolution Notes / Adjustment Voucher"
              placeholder="e.g. Verified stone weight against certified gemological lab report. Accepted SBG net weight..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
            />

            <div className="pt-4 border-t border-[#DCE5E3] flex justify-end gap-3">
              <SBGButton variant="outline" type="button" onClick={() => setSelectedItem(null)}>
                Cancel
              </SBGButton>
              <SBGButton variant="primary" type="submit">
                Approve & Mark Reconciled
              </SBGButton>
            </div>
          </form>
        </SBGModal>
      )}
    </div>
  );
};
