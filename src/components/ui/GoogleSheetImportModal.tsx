import React, { useState } from 'react';
import { useSBG } from '../../store/sbgStore';
import { SBGModal, SBGButton } from './index';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
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
      if (index === 0 && (line.toLowerCase().includes('date') || line.toLowerCase().includes('particulars'))) {
        return;
      }

      // Split by tab (\t) or comma (,)
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cols.length < 3) return; // Skip empty/invalid lines

      try {
        const rawDate = cols[0]?.trim() || '';
        const rawDir = cols[1]?.trim().toUpperCase() || 'ISSUE';
        const rawParticulars = cols[2]?.trim() || 'SALE';
        const description = cols[3]?.trim() || '';
        const nos = parseFloat(cols[4]?.replace(/[^0-9.]/g, '') || '0') || 0;
        const grossWT = parseFloat(cols[5]?.replace(/[^0-9.]/g, '') || '0') || 0;
        const stoneWT = parseFloat(cols[7]?.replace(/[^0-9.]/g, '') || cols[6]?.replace(/[^0-9.]/g, '') || '0') || 0;
        
        let rawTouch = cols[9]?.replace(/[^0-9.]/g, '') || '91.6';
        let touch = parseFloat(rawTouch) || 91.6;
        if (touch < 1 && touch > 0) touch = touch * 100; // e.g. 0.76 -> 76%

        const rawStoneAmt = cols[11]?.replace(/[^0-9.-]/g, '') || cols[10]?.replace(/[^0-9.-]/g, '') || '0';
        const stoneAmount = Math.abs(parseFloat(rawStoneAmt) || 0);

        const rawMCAmt = cols[13]?.replace(/[^0-9.-]/g, '') || cols[12]?.replace(/[^0-9.-]/g, '') || '0';
        const mcAmount = Math.abs(parseFloat(rawMCAmt) || 0);

        // Determine Direction
        const direction: TransactionDirection =
          rawDir.includes('RECEIPT') || rawParticulars.toUpperCase().includes('PURCHASE') ? 'RECEIPT' : 'ISSUE';

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
    const sample = `29-05-26\tRECEIPT\tPURCHASE\tRD/BB/031/26-27\t50\t23.085\t-23.085\t1.478\t-21.607\t76.00%\t-16.421\t₹ 222,583.00\t-222583\t0\t0\t-222583.00
03-06-26\tISSUE\tPR\tDN/003/26-27\t1\t0.344\t0.344\t0.012\t0.332\t76.00%\t0.252\t₹ 4,063.00\t4063\t0\t0\t4063.00
03-06-26\tISSUE\tsale\tSBG/BB/047\t0\t16.510\t16.51\t0.000\t16.510\t99.90%\t16.493\t0\t0\t0\t0\t0.00
10-06-26\tISSUE\tPAYMENT\tPAYMENT\t0\t0.000\t0\t0.000\t0.000\t0.00%\t0.000\t₹ 100,000.00\t100000\t0\t0\t100000.00
19-06-26\tISSUE\tPAYMENT\tPAYMENT\t0\t0.000\t0\t0.000\t0.000\t0.00%\t0.000\t₹ 112,155.00\t112155\t0\t0\t112155.00
07-07-26\tISSUE\tISSUE\tJWI/148/26-27\t1\t2.036\t2.036\t0.018\t2.018\t92.00%\t1.857\t0\t0\t0\t0\t0.00
07-07-26\tISSUE\tISSUE\tJWI/148/26-27\t1\t3.734\t3.734\t0.050\t3.684\t75.00%\t2.763\t0\t0\t0\t0\t0.00
19-08-26\tRECEIPT\tPURCHASE\tRD/BB/087/26-27\t2\t2.225\t-2.225\t0.132\t-2.093\t76.00%\t-1.591\t₹ 15,494.00\t-15494\t0\t0\t-15494.00
02-09-26\tRECEIPT\tPURCHASE\tRD/BB/094/26-27\t22\t18.476\t-18.476\t0.906\t-17.570\t76.00%\t-13.353\t₹ 128,094.51\t-128094.51\t0\t0\t-128094.51
02-09-26\tRECEIPT\tPURCHASE\tRD/BB/097/26-27\t0\t0.100\t-0.1\t0.000\t-0.100\t76.00%\t-0.076\t0\t0\t0\t0\t0.00
04-09-26\tISSUE\tsale\tSBG/BB/088/26-27\t0\t14.770\t14.77\t0.000\t14.770\t99.50%\t14.696\t0\t0\t0\t0\t0.00
05-09-26\tISSUE\tPAYMENT\tPAYMENT\t0\t0.000\t0\t0.000\t0.000\t0.00%\t0.000\t₹ 146,223.00\t146223\t0\t0\t146223.00
11-09-26\tRECEIPT\tPURCHASE\tRD/BB/104/26-27\t1\t0.403\t-0.403\t0.018\t-0.385\t76.00%\t-0.293\t₹ 1,533.00\t-1533\t0\t0\t-1533.00`;

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
                <h4 className="text-xs font-bold text-[#173333]">Copy-Paste or Upload Google Sheet Data</h4>
                <p className="text-[11px] text-[#647777]">
                  Copy cells directly from Google Sheet/Excel (TSV) or upload a CSV file.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadTIKVAHSampleData}
                className="text-[11px] font-bold text-[#0F5C5B] hover:bg-[#0F5C5B]/10 px-2.5 py-1.5 rounded-lg border border-[#0F5C5B]/30 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Load TIKVAH Google Sheet
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
              Paste Rows (TSV / Google Sheet Cells)
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={handleTextChange}
              placeholder="Paste Google Sheet rows here (e.g. 29-05-26  RECEIPT  PURCHASE  RD/BB/031/26-27  50  23.085  1.478  76.00%  222583)..."
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
                  Parsed {parsedRows.length} Google Sheet Transactions
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
                      <th className="py-2 px-2">Type</th>
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
                            ? 'bg-[#FCE8E6]/60 text-[#C5221F]'
                            : 'bg-[#D9EAD3]/60 text-[#274E13]'
                        }
                      >
                        <td className="py-1.5 px-2 font-semibold">{r.date}</td>
                        <td className="py-1.5 px-2 font-bold">{r.direction}</td>
                        <td className="py-1.5 px-2">{r.particulars}</td>
                        <td className="py-1.5 px-2 max-w-[120px] truncate">{r.description}</td>
                        <td className="py-1.5 px-2 text-right">{r.nos}</td>
                        <td className="py-1.5 px-2 text-right">{r.grossWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right">{r.stoneWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">{r.netWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right">{r.touch.toFixed(2)}%</td>
                        <td className="py-1.5 px-2 text-right font-bold">{r.pureWT.toFixed(3)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">
                          {r.stoneAmount > 0 ? `₹${r.stoneAmount.toLocaleString('en-IN')}` : '-'}
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
