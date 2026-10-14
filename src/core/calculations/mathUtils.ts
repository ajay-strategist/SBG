/**
 * High-precision mathematical rounding utilities for jewellery financial calculations.
 * Avoids floating-point drift (e.g. 0.1 + 0.2 !== 0.3).
 */

export function round(value: number, decimals: number = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Standard 3-decimal precision for Gold / Silver weights (grams).
 */
export function roundWeight(val: number): number {
  return round(val, 3);
}

/**
 * Standard 2-decimal precision for Currency / Indian Rupees (₹).
 */
export function roundCurrency(val: number): number {
  return round(val, 2);
}

/**
 * Standard 3-decimal precision for Gemstones & Diamonds (carats).
 */
export function roundCarat(val: number): number {
  return round(val, 3);
}

/**
 * Standard 2-decimal precision for Touch / Purity percentages (e.g. 76.00%).
 */
export function roundPurity(val: number): number {
  return round(val, 2);
}

/**
 * Format ISO / YYYY-MM-DD date string to Indian commercial standard DD-MM-YYYY (e.g. 23-09-2026).
 */
export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.split('T')[0].split('-');
    return `${d}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }
  return trimmed;
}

/**
 * Converts numeric amount (INR) into formal English Indian currency words.
 * e.g. 522046.03 -> "Five Lakh Twenty Two Thousand Forty Six Rupees and Three Paise Only"
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || !isFinite(num)) return 'Zero Rupees Only';
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? ' ' + ones[o] : '');
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h) res += ones[h] + ' Hundred';
    if (rem) {
      if (res) res += ' ';
      res += convertTwoDigits(rem);
    }
    return res;
  }

  let words = '';
  let n = integerPart;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundredAndBelow = n;

  if (crore > 0) {
    words += convertThreeDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundredAndBelow > 0) {
    words += convertThreeDigits(hundredAndBelow) + ' ';
  }

  words = words.trim();
  if (!words) words = 'Zero';
  words += ' Rupees';

  if (decimalPart > 0) {
    words += ' and ' + convertTwoDigits(decimalPart) + ' Paise';
  }
  words += ' Only';

  return words;
}

