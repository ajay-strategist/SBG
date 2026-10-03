import React, { useState } from 'react';
import { useSBG } from '../../store/sbgStore';
import { SBGModal, SBGButton } from './index';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, RefreshCw, FileText, Download } from 'lucide-react';
import { LedgerTransaction, TransactionDirection, ParticularsType } from '../../core/calculations/types';

interface GoogleSheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

interface ParsedRow {
  date: string;
  direction: TransactionDirection;
  particulars: ParticularsType;
  description: string;
  nos: number;
  grossWT: number;
  stoneWT: number;
  netWT: number;
  touch: number;
  pureWT: number;
  stoneAmount: number;
  stoneAmountCal: number;
  mcAmount: number;
  mcAmountCal: number;
  totalAmount: number;
  isValid: boolean;
  error?: string;
}

export const GoogleSheetImportModal: React.FC<GoogleSheetImportModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
}) => {
  const { importCustomerTransactions } = useSBG();

  const [rawText, setRawText] = useState<string>('');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const downloadTemplateCSV = () => {
    const csvContent = `Date,Issue/Receipt,Particulars,Description,Nos,Gross WT,Stone WT,Net WT,Touch,Pure WT,Stone Amount,MC Amount,Total Amount,Balance MC,Balance WT
29/05/26,RECEIPT,PURCHASE,RD/BB/031/26-27,50,-23.085,1.478,-21.607,76.00%,-16.421,"(₹2,22,583.00)",0,"(₹2,22,583.00)","(₹2,22,583.00)",-16.421
03/06/26,ISSUE,PURCHASE,DN/003/26-27,1,0.344,0.012,0.332,76.00%,0.252,"₹4,063.00",0,"₹4,063.00","(₹2,18,520.00)",-16.169
03/06/26,ISSUE,SALES,SBG/BB/047,,16.510,,16.510,99.90%,16.493,0,0,"₹-","(₹2,18,520.00)",0.324
10/06/26,ISSUE,PAYMENT,,,0,0,0,0.00%,0,"₹1,00,000.00",0,"₹1,00,000.00","(₹1,18,520.00)",0.324
19/06/26,ISSUE,PAYMENT,,,0,0,0,0.00%,0,"₹1,12,155.00",0,"₹1,12,155.00","(₹6,365.00)",0.324
07/07/26,ISSUE,ISSUE,JWI/148/26-27,1,2.036,0.018,2.018,92.00%,1.857,0,0,"₹-","(₹6,365.00)",2.181
07/07/26,ISSUE,ISSUE,JWI/148/26-27,1,3.734,0.050,3.684,75.00%,2.763,0,0,"₹-","(₹6,365.00)",4.944
19/08/26,RECEIPT,PURCHASE,RD/BB/087/26-27,2,-2.225,0.132,-2.093,76.00%,-1.591,"(₹15,494.00)",0,"(₹15,494.00)","(₹21,859.00)",3.353`;

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SBG_Customer_Ledger_Bulk_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to convert DD-MM-YY or DD/MM/YYYY to YYYY-MM-DD
  const formatDateString = (rawDate: string): string => {
    const trimmed = rawDate.trim();
    if (!trimmed) return new Date().toISOString().split('T')[0];

    // Check if already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // Split by - or /
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.length === 2) y = `20${y}`;
      const day = d.padStart(2, '0');
      const month = m.padStart(2, '0');
      return `${y}-${month}-${day}`;
    }

    return new Date().toISOString().split('T')[0];
  };

  // Helper to parse numeric values handling Excel accounting format (parentheses like (₹2,22,583.00) or negative signs)
  const parseNumericValue = (val: string | undefined): number => {
    if (!val) return 0;
    const cleaned = val.trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '₹-' || cleaned === '₹ -' || cleaned === '₹') return 0;

    const isNegative = cleaned.includes('(') || cleaned.startsWith('-');
    const digitsOnly = cleaned.replace(/[^0-9.]/g, '');
    const num = parseFloat(digitsOnly) || 0;
    return isNegative ? -Math.abs(num) : Math.abs(num);
  };

  // Robust line splitter for TSV and CSV that preserves empty cells (,, or \t\t)
  const parseLineToCols = (line: string): string[] => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''));
    }

    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const parseInputText = (text: string) => {
    setParseError(null);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/);
    const rows: ParsedRow[] = [];

    lines.forEach((line, index) => {
      // Ignore header rows
      const lower = line.toLowerCase();
      if (index === 0 && (lower.includes('date') || lower.includes('particulars') || lower.includes('issue/receipt') || lower.includes('column1'))) {
        return;
      }

      const cols = parseLineToCols(line);
      if (cols.length < 3) return; // Skip empty/invalid lines

      try {
        const rawDate = cols[0] || '';
        const rawDir = cols[1]?.toUpperCase() || 'ISSUE';
        const rawParticulars = cols[2] || 'SALE';
        const description = cols[3] || '';
        
        const nos = Math.abs(parseNumericValue(cols[4]));
        
        // Exact 15-column Index Mapping matching Excel template:
        // Index 5 = Gross WT, Index 6 = Stone WT, Index 7 = Net WT, Index 8 = Touch, Index 9 = Pure WT
        const parsedGross = parseNumericValue(cols[5]);
        const parsedStoneWT = parseNumericValue(cols[6]);
        const grossWT = Math.abs(parsedGross);
        const stoneWT = Math.abs(parsedStoneWT);
        
        let touch = parseNumericValue(cols[8]);
        if (touch < 0) touch = Math.abs(touch);
        if (touch < 1 && touch > 0) touch = touch * 100; // e.g. 0.76 -> 76%

        // Index 10 = Stone Amount, Index 11 = MC Amount, Index 12 = Total Amount
        const parsedStoneAmt = parseNumericValue(cols[10]);
        const parsedMCAmt = parseNumericValue(cols[11]);
        const parsedTotalAmt = parseNumericValue(cols[12]);

        const stoneAmount = Math.abs(parsedStoneAmt);
        const mcAmount = Math.abs(parsedMCAmt);

        // Determine Direction accurately
        const isDirReceipt =
          rawDir.includes('RECEIPT') ||
          rawParticulars.toUpperCase().includes('PURCHASE') ||
          parsedGross < 0 ||
          parsedStoneAmt < 0 ||
          parsedTotalAmt < 0;

        const direction: TransactionDirection = isDirReceipt ? 'RECEIPT' : 'ISSUE';

        // Normalize Particulars
        let particulars: ParticularsType = 'SALE';
        const upperP = rawParticulars.toUpperCase();
        if (upperP.includes('PURCHASE')) particulars = 'PURCHASE';
        else if (upperP.includes('PR')) particulars = 'PR';
        else if (upperP.includes('PAYMENT')) particulars = 'PAYMENT_RECEIVED';
        else if (upperP.includes('SALE')) particulars = 'SALE';
        else if (upperP.includes('ISSUE')) particulars = 'ISSUE';

        // Calculations
        const isReceipt = direction === 'RECEIPT';
        const rawNetWT = Math.max(0, grossWT - stoneWT);
        const netWT = isReceipt ? -rawNetWT : rawNetWT;
        const pureWT = Number((netWT * (touch / 100)).toFixed(3));

        const stoneAmountCal = isReceipt ? -stoneAmount : stoneAmount;
        const mcAmountCal = isReceipt ? -mcAmount : mcAmount;
        const totalAmount = Number((stoneAmountCal + mcAmountCal).toFixed(2));

        const formattedDate = formatDateString(rawDate);

        rows.push({
          date: formattedDate,
          direction,
          particulars,
          description,
          nos,
          grossWT,
          stoneWT,
          netWT,
          touch,
          pureWT,
          stoneAmount,
          stoneAmountCal,
          mcAmount,
          mcAmountCal,
          totalAmount,
          isValid: true,
        });
      } catch (err) {
        console.error('Row parse error line', index, err);
      }
    });

    setParsedRows(rows);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseInputText(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseInputText(text);
    };
    reader.readAsText(file);
  };

  const loadTIKVAHSampleData = () => {
    const sample = `29/05/26\tRECEIPT\tPURCHASE\tRD/BB/031/26-27\t50\t-23.085\t1.478\t-21.607\t76.00%\t-16.421\t(₹2,22,583.00)\t0\t(₹2,22,583.00)\t(₹2,22,583.00)\t-16.421
03/06/26\tISSUE\tPURCHASE\tDN/003/26-27\t1\t0.344\t0.012\t0.332\t76.00%\t0.252\t₹4,063.00\t0\t₹4,063.00\t(₹2,18,520.00)\t-16.169
03/06/26\tISSUE\tSALES\tSBG/BB/047\t\t16.510\t\t16.510\t99.90%\t16.493\t0\t0\t₹-\t(₹2,18,520.00)\t0.324
10/06/26\tISSUE\tPAYMENT\t\t\t0\t0\t0\t0.00%\t0\t₹1,00,000.00\t0\t₹1,00,000.00\t(₹1,18,520.00)\t0.324
19/06/26\tISSUE\tPAYMENT\t\t\t0\t0\t0\t0.00%\t0\t₹1,12,155.00\t0\t₹1,12,155.00\t(₹6,365.00)\t0.324
07/07/26\tISSUE\tISSUE\tJWI/148/26-27\t1\t2.036\t0.018\t2.018\t92.00%\t1.857\t0\t0\t₹-\t(₹6,365.00)\t2.181
07/07/26\tISSUE\tISSUE\tJWI/148/26-27\t1\t3.734\t0.050\t3.684\t75.00%\t2.763\t0\t0\t₹-\t(₹6,365.00)\t4.944
19/08/26\tRECEIPT\tPURCHASE\tRD/BB/087/26-27\t2\t-2.225\t0.132\t-2.093\t76.00%\t-1.591\t(₹15,494.00)\t0\t(₹15,494.00)\t(₹21,859.00)\t3.353`;

    setRawText(sample);
    parseInputText(sample);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    const txDataList: Omit<LedgerTransaction, 'id' | 'createdAt' | 'updatedAt' | 'balanceWT' | 'balanceMC'>[] =
      parsedRows.map((r) => ({
        customerId,
        date: r.date,
        direction: r.direction,
        particulars: r.particulars,
        description: r.description,
        nos: r.nos,
        grossWT: r.grossWT,
        stoneWT: r.stoneWT,
        netWT: r.netWT,
        touch: r.touch,
        pureWT: r.pureWT,
        stoneAmount: r.stoneAmount,
        stoneAmountCal: r.stoneAmountCal,
        mcRate: 0,
        mcAmount: r.mcAmount,
        mcAmountCal: r.mcAmountCal,
        totalAmount: r.totalAmount,
        status: 'CONFIRMED',
      }));

    await importCustomerTransactions(customerId, txDataList, replaceExisting);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <SBGModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Import / Update Ledger for ${customerName}`}
      size="xl"
    >
      {isSuccess ? (
        <div className="py-12 text-center space-y-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-[#0F5C5B]">Customer Ledger Updated Successfully!</h3>
          <p className="text-xs text-[#647777]">
            {parsedRows.length} transactions imported. Running balances recalculated live.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Instructions & Action Panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#F2FAF8] rounded-2xl border border-[#DCE5E3]">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-[#0F5C5B] shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#173333]">Copy-Paste or Upload Excel / Sheet Data</h4>
                <p className="text-[11px] text-[#647777]">
                  Paste Excel rows directly or upload a CSV matching the 15-column template.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadTemplateCSV}
                className="text-[11px] font-bold text-[#0F5C5B] bg-white hover:bg-[#0F5C5B]/5 px-2.5 py-1.5 rounded-lg border border-[#0F5C5B]/30 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3 h-3 text-[#0F5C5B]" /> Download Template CSV
              </button>

              <button
                type="button"
                onClick={loadTIKVAHSampleData}
                className="text-[11px] font-bold text-[#0F5C5B] hover:bg-[#0F5C5B]/10 px-2.5 py-1.5 rounded-lg border border-[#0F5C5B]/30 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Load TIKVAH Preset
              </button>

              <label className="text-[11px] font-bold text-white bg-[#0F5C5B] hover:bg-[#093D3C] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
                <Upload className="w-3 h-3" /> Upload CSV
                <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Text Area for Pasting */}
          <div>
            <label className="block text-xs font-bold text-[#173333] mb-1">
              Paste Excel Rows (TSV / CSV Cells)
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={handleTextChange}
              placeholder="Paste Excel template cells here (Date, Issue/Receipt, Particulars, Description, Nos, Gross WT, Stone WT, Net WT, Touch, Pure WT, Stone Amount, MC Amount, Total Amount, Balance MC, Balance WT)..."
              className="w-full font-mono text-xs p-3 bg-white border border-[#DCE5E3] rounded-xl focus:ring-2 focus:ring-[#0F5C5B] focus:border-transparent outline-none"
            />
          </div>

          {/* Import Mode Option */}
          <div className="flex items-center gap-4 text-xs font-medium bg-white p-3 rounded-xl border border-[#DCE5E3]">
            <span className="font-bold text-[#173333]">Import Strategy:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                checked={replaceExisting}
                onChange={() => setReplaceExisting(true)}
                className="accent-[#0F5C5B]"
              />
              <span>Replace entire customer ledger (Clean Sync)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                checked={!replaceExisting}
                onChange={() => setReplaceExisting(false)}
                className="accent-[#0F5C5B]"
              />
              <span>Append to existing transactions</span>
            </label>
          </div>

          {/* Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0F5C5B] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Parsed {parsedRows.length} Ledger Transactions
                </span>
                <span className="text-[#647777] font-mono">
                  Pure WT Sum: {parsedRows.reduce((acc, r) => acc + r.pureWT, 0).toFixed(3)}g | Total Amount Sum: ₹
                  {parsedRows.reduce((acc, r) => acc + r.totalAmount, 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-[#DCE5E3]">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-[#0F5C5B]/10 text-[#0F5C5B] font-bold uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Issue/Receipt</th>
                      <th className="py-2 px-2">Particulars</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 text-right">Nos</th>
                      <th className="py-2 px-2 text-right">Gross WT</th>
                      <th className="py-2 px-2 text-right">Stone WT</th>
                      <th className="py-2 px-2 text-right">Net WT</th>
                      <th className="py-2 px-2 text-right">Touch</th>
                      <th className="py-2 px-2 text-right">Pure WT</th>
                      <th className="py-2 px-2 text-right">Stone Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5E3]">
                    {parsedRows.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          r.direction === 'RECEIPT'
                            ? 'bg-[#FCE8E6]/70 text-[#900C3F]'
                            : 'bg-[#D9EAD3]/70 text-[#1E4620]'
                        }
                      >
                        <td className="py-1.5 px-2 font-semibold">{r.date}</td>
                        <td className="py-1.5 px-2 font-bold">{r.direction}</td>
                        <td className="py-1.5 px-2 font-bold uppercase">{r.particulars}</td>
                        <td className="py-1.5 px-2 max-w-[120px] truncate">{r.description || '-'}</td>
                        <td className="py-1.5 px-2 text-right">{r.nos || '-'}</td>
                        <td className="py-1.5 px-2 text-right">{r.grossWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right">{r.stoneWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">{r.netWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right">{r.touch > 0 ? `${r.touch.toFixed(2)}%` : '-'}</td>
                        <td className="py-1.5 px-2 text-right font-bold">{r.pureWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">
                          {r.stoneAmount > 0
                            ? `₹${r.stoneAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE5E3]">
            <SBGButton variant="outline" size="sm" onClick={onClose}>
              Cancel
            </SBGButton>
            <SBGButton
              variant="primary"
              size="sm"
              disabled={parsedRows.length === 0}
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleConfirmImport}
            >
              Confirm & Update Customer Ledger ({parsedRows.length} Rows)
            </SBGButton>
          </div>
        </div>
      )}
    </SBGModal>
  );
};
