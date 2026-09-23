import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGInput,
  SBGBadge,
} from '../components/ui';
import {
  Settings as SettingsIcon,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface SettingsViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const {
    goldMarketRate,
    setGoldMarketRate,
    defaultGSTRate,
    setDefaultGSTRate,
    refreshFromDatabase,
    clearAllData,
    syncStatus,
    isLoading,
  } = useSBG();

  const [rateInput, setRateInput] = useState(goldMarketRate.toString());
  const [gstInput, setGstInput] = useState(defaultGSTRate.toString());
  const [companyName, setCompanyName] = useState('SBG Enterprises & Jewellery Corp');
  const [companyGST, setCompanyGST] = useState('27AAACR9910K1Z4');
  const [saveAlert, setSaveAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('Settings updated successfully!');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(rateInput);
    const parsedGST = parseFloat(gstInput);

    if (!isNaN(parsedRate) && parsedRate > 0) {
      setGoldMarketRate(parsedRate);
    }
    if (!isNaN(parsedGST) && parsedGST >= 0) {
      setDefaultGSTRate(parsedGST);
    }

    setAlertMessage('Settings updated successfully!');
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  const handleSyncDatabase = async () => {
    await refreshFromDatabase();
    setAlertMessage('Synced live data with Supabase DB!');
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all local data? This will reset all customers, orders, transactions, estimates, and settlements to zero.')) {
      clearAllData();
      setAlertMessage('All data cleared. System reset to zero state.');
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F5C5B] flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-[#0F5C5B]" /> System Configuration & Settings
          </h2>
          <p className="text-xs text-[#647777] mt-0.5">
            Global market rates, default GST percentages, company entity details, and state maintenance
          </p>
        </div>

        {saveAlert && (
          <div className="flex items-center gap-1.5 text-xs text-[#3E8B68] font-bold bg-[#3E8B68]/15 px-3 py-1.5 rounded-xl border border-[#3E8B68]/30">
            <CheckCircle2 className="w-4 h-4" /> {alertMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Metal Rates & Tax Parameters */}
        <SBGCard variant="glass" className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Market Rates & Financial Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SBGInput
              label="Standard Gold Market Rate (₹/g - 99.5 purity)"
              type="number"
              step="0.01"
              suffixText="₹/g"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              helperText="Default rate applied when generating new estimates and cost sheets"
              required
            />

            <SBGInput
              label="Default Jewellery GST Rate (%)"
              type="number"
              step="0.1"
              suffixText="%"
              value={gstInput}
              onChange={(e) => setGstInput(e.target.value)}
              helperText="Standard Indian GST on precious metal jewellery (default 3.0%)"
              required
            />
          </div>
        </SBGCard>

        {/* Company Identity */}
        <SBGCard variant="glass" className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
            <Building className="w-4 h-4" /> Commercial Legal Entity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SBGInput
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <SBGInput
              label="GSTIN / Corporate Tax ID"
              value={companyGST}
              onChange={(e) => setCompanyGST(e.target.value)}
            />
          </div>
        </SBGCard>

        {/* Database & Local Cache Management */}
        <SBGCard variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Database & Storage Management
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#0F5C5B]/10 text-[#0F5C5B] font-bold">
              Status: {syncStatus}
            </span>
          </div>

          <p className="text-xs text-[#647777]">
            Sync with the connected Supabase cloud database or clear all local caches to reset numbers to fresh state.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSyncDatabase}
              className="px-4 py-2 rounded-xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isLoading ? 'Syncing...' : 'Sync with Supabase DB'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Clear All Data (Reset to Zero)</span>
            </button>
          </div>
        </SBGCard>

        <div className="flex justify-end items-center pt-2">
          <SBGButton variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
            Save Configuration
          </SBGButton>
        </div>
      </form>
    </div>
  );
};
