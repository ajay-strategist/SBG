import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  KeyRound,
  Landmark,
} from 'lucide-react';
import { DEFAULT_BANK_DETAILS } from '../core/calculations/types';
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
    bankDetails,
    updateBankDetails,
    companyDetails,
    updateCompanyDetails,
    refreshFromDatabase,
    clearAllData,
    syncStatus,
    isLoading,
    currentUser,
    updateUser,
    logAudit,
  } = useSBG();

  const [rateInput, setRateInput] = useState(goldMarketRate.toString());
  const [gstInput, setGstInput] = useState(defaultGSTRate.toString());
  const [companyName, setCompanyName] = useState(companyDetails.companyName);
  const [companyGST, setCompanyGST] = useState(companyDetails.gstin);

  // Bank Account State
  const [accountName, setAccountName] = useState(bankDetails.accountName);
  const [bankName, setBankName] = useState(bankDetails.bankName);
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber);
  const [ifscCode, setIfscCode] = useState(bankDetails.ifscCode);
  const [branch, setBranch] = useState(bankDetails.branch || '');

  const [saveAlert, setSaveAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('Settings updated successfully!');

  // Sync state if store updates from external changes
  useEffect(() => {
    setAccountName(bankDetails.accountName);
    setBankName(bankDetails.bankName);
    setAccountNumber(bankDetails.accountNumber);
    setIfscCode(bankDetails.ifscCode);
    setBranch(bankDetails.branch || '');
  }, [bankDetails]);

  useEffect(() => {
    setCompanyName(companyDetails.companyName);
    setCompanyGST(companyDetails.gstin);
  }, [companyDetails]);

  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';

  const handleUpdatePassword = () => {
    setPasswordFeedback(null);
    if (!newPassword || newPassword.length < 4) {
      setPasswordFeedback({ message: 'Password must be at least 4 characters long.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ message: 'New password and confirmation do not match.', isError: true });
      return;
    }

    updateUser(currentUser.id, { password: newPassword });
    setPasswordFeedback({ message: 'Password updated successfully!', isError: false });
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordFeedback(null), 4000);
  };

  const handleSaveBankDetails = () => {
    if (!isAdmin) return;
    const trimmedBank = {
      accountName: accountName.trim() || DEFAULT_BANK_DETAILS.accountName,
      bankName: bankName.trim() || DEFAULT_BANK_DETAILS.bankName,
      accountNumber: accountNumber.trim() || DEFAULT_BANK_DETAILS.accountNumber,
      ifscCode: ifscCode.trim().toUpperCase() || DEFAULT_BANK_DETAILS.ifscCode,
      branch: branch.trim(),
    };

    updateBankDetails(trimmedBank);
    logAudit(
      'UPDATE_BANK_DETAILS',
      'SETTINGS',
      'bank_details',
      `Updated bank details to ${trimmedBank.bankName} (${trimmedBank.accountNumber})`,
      bankDetails,
      trimmedBank
    );

    setAlertMessage('Bank account details updated successfully!');
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  const handleResetBankDetails = () => {
    setAccountName(DEFAULT_BANK_DETAILS.accountName);
    setBankName(DEFAULT_BANK_DETAILS.bankName);
    setAccountNumber(DEFAULT_BANK_DETAILS.accountNumber);
    setIfscCode(DEFAULT_BANK_DETAILS.ifscCode);
    setBranch(DEFAULT_BANK_DETAILS.branch || '');
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;

    const parsedRate = parseFloat(rateInput);
    const parsedGST = parseFloat(gstInput);

    if (!isNaN(parsedRate) && parsedRate > 0) {
      setGoldMarketRate(parsedRate);
    }
    if (!isNaN(parsedGST) && parsedGST >= 0) {
      setDefaultGSTRate(parsedGST);
    }

    // Save Company Details
    updateCompanyDetails({
      companyName: companyName.trim() || companyDetails.companyName,
      gstin: companyGST.trim().toUpperCase() || companyDetails.gstin,
    });

    // Save Bank Details
    const trimmedBank = {
      accountName: accountName.trim() || DEFAULT_BANK_DETAILS.accountName,
      bankName: bankName.trim() || DEFAULT_BANK_DETAILS.bankName,
      accountNumber: accountNumber.trim() || DEFAULT_BANK_DETAILS.accountNumber,
      ifscCode: ifscCode.trim().toUpperCase() || DEFAULT_BANK_DETAILS.ifscCode,
      branch: branch.trim(),
    };
    updateBankDetails(trimmedBank);

    logAudit(
      'UPDATE_SETTINGS',
      'SETTINGS',
      'system_configuration',
      'Updated market rates, financial defaults, company details, and bank account details'
    );

    setAlertMessage('Settings & Bank Details updated successfully!');
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  const handleSyncDatabase = async () => {
    if (!isAdmin) return;
    await refreshFromDatabase();
    setAlertMessage('Synced live data with Supabase DB!');
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  const handleClearAll = () => {
    if (!isAdmin) return;
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
            <SettingsIcon className="w-6 h-6 text-[#0F5C5B]" />
            {isAdmin ? 'System Configuration & Settings' : 'Account Settings & Security'}
          </h2>
          <p className="text-xs text-[#647777] mt-0.5">
            {isAdmin
              ? 'Global market rates, default GST percentages, company entity details, and settlement bank accounts'
              : `Manage personal credentials and password security for ${currentUser.name} (${currentUser.role})`}
          </p>
        </div>

        {saveAlert && (
          <div className="flex items-center gap-1.5 text-xs text-[#3E8B68] font-bold bg-[#3E8B68]/15 px-3 py-1.5 rounded-xl border border-[#3E8B68]/30">
            <CheckCircle2 className="w-4 h-4" /> {alertMessage}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Metal Rates & Tax Parameters — Admin Only */}
        {isAdmin && (
          <div className="space-y-6">
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

            {/* Commercial Legal Entity — Admin Only */}
            <SBGCard variant="glass" className="p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
                <Building className="w-4 h-4" /> Commercial Legal Entity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SBGInput
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  helperText="Official registered business trading name"
                />

                <SBGInput
                  label="GSTIN / Corporate Tax ID"
                  value={companyGST}
                  onChange={(e) => setCompanyGST(e.target.value)}
                  helperText="Goods and Services Tax Identification Number"
                />
              </div>
            </SBGCard>

            {/* Bank Account Details for Settlement (RTGS / NEFT) — Admin Only */}
            <SBGCard variant="glass" className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE5E3]/70 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#0F5C5B]" /> Bank Account Details for Settlement (RTGS / NEFT)
                  </h3>
                  <p className="text-xs text-[#647777] mt-0.5">
                    Official banking details displayed on printable estimates, tax invoices, and settlement vouchers
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2.5 py-1 rounded-full border border-[#0F5C5B]/20 w-fit">
                  RTGS / NEFT Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SBGInput
                  label="Beneficiary / A/C Name"
                  placeholder="e.g. SREE BALAJI GOLD"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  helperText="Exact account title registered with the bank"
                  required
                />

                <SBGInput
                  label="Bank Name"
                  placeholder="e.g. HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  helperText="Commercial or retail banking institution"
                  required
                />

                <SBGInput
                  label="Account Number (A/C No)"
                  placeholder="e.g. 50200088992211"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  helperText="Current, CC, or settlement bank account number"
                  required
                />

                <SBGInput
                  label="IFSC Code"
                  placeholder="e.g. HDFC0000123"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  helperText="11-character Indian Financial System Code"
                  required
                />

                <div className="sm:col-span-2">
                  <SBGInput
                    label="Branch Location (Optional)"
                    placeholder="e.g. Main Branch / Zaveri Bazaar"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    helperText="Branch address or area for RTGS/NEFT routing verification"
                  />
                </div>
              </div>

              {/* Live Preview Matching Print Card Specification */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#647777] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D9B76C]" />
                    Live Print & Settlement Voucher Preview
                  </span>
                  <span className="text-[10px] text-[#3E8B68] font-semibold bg-[#3E8B68]/10 px-2 py-0.5 rounded-md border border-[#3E8B68]/20">
                    Live Preview
                  </span>
                </div>

                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#ECD9A5]/80 shadow-xs space-y-2">
                  <div className="font-bold text-[#0F5C5B] uppercase tracking-wide flex items-center gap-2 text-xs sm:text-sm">
                    <Building className="w-4 h-4 text-[#D9B76C] shrink-0" />
                    <span>BANK DETAILS FOR ELECTRONIC SETTLEMENT (RTGS / NEFT)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-1 text-xs text-[#173333] font-mono">
                    <div>
                      <span className="text-[#647777] font-sans">A/C Name:</span>{' '}
                      <strong className="text-[#173333] font-bold">{accountName || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[#647777] font-sans">Bank:</span>{' '}
                      <strong className="text-[#173333] font-bold">{bankName || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[#647777] font-sans">A/C No:</span>{' '}
                      <strong className="text-[#173333] font-bold tracking-wider">{accountNumber || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[#647777] font-sans">IFSC:</span>{' '}
                      <strong className="text-[#173333] font-bold tracking-wider">{ifscCode || '—'}</strong>
                    </div>
                    {branch && (
                      <div className="sm:col-span-2">
                        <span className="text-[#647777] font-sans">Branch:</span>{' '}
                        <strong className="text-[#173333] font-bold">{branch}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Bank Details Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DCE5E3]/60">
                <button
                  type="button"
                  onClick={handleResetBankDetails}
                  className="text-xs text-[#647777] hover:text-[#0F5C5B] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Default Bank Details
                </button>

                <SBGButton
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleSaveBankDetails}
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Bank Details
                </SBGButton>
              </div>
            </SBGCard>
          </div>
        )}


        {/* Account Security & Password Management — Permitted for Both Admin & Staff */}
        <SBGCard variant="glass" className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Account Security & Password
              </h3>
              <p className="text-xs text-[#647777] mt-0.5">
                Active {isAdmin ? 'administrator' : 'staff'} credentials ({currentUser.email || currentUser.username})
              </p>
            </div>
            <SBGBadge variant={isAdmin ? 'gold' : 'teal'} className="self-start sm:self-auto">
              Role: {currentUser.role}
            </SBGBadge>
          </div>

          <div className="bg-[#F6F8F7] p-4 rounded-2xl border border-[#DCE5E3]/80 space-y-3">
            <div className="text-xs font-bold text-[#173333] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#0F5C5B]" />
              <span>Change {isAdmin ? 'Administrator' : 'Staff'} Password</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SBGInput
                label="New Password"
                type="password"
                placeholder="Enter new password (min. 4 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <SBGInput
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {passwordFeedback && (
              <div
                className={`text-xs font-semibold p-2.5 rounded-xl flex items-center gap-2 ${
                  passwordFeedback.isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {!passwordFeedback.isError && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleUpdatePassword}
                className="px-4 py-2 rounded-xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </SBGCard>

        {/* Database & Local Cache Management — Admin Only */}
        {isAdmin && (
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
        )}

        {/* Save Configuration Button — Admin Only */}
        {isAdmin && (
          <div className="flex justify-end items-center pt-2">
            <SBGButton variant="primary" type="button" onClick={() => handleSave()} icon={<Save className="w-4 h-4" />}>
              Save Configuration
            </SBGButton>
          </div>
        )}
      </div>
    </div>
  );
};
