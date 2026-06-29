/**
 * Upgraded receipt generator — used by student fee detail and family-pay pages.
 * Renders a full HTML document with styling, branding, and barcode.
 * Supports expanded current-month breakdown + previous balance summary.
 */

// ——— Amount in words ———
const ONES = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const convert = (num: number): string => {
    if (num < 20) return ONES[num];
    if (num < 100) return TENS[Math.floor(num / 10)] + (num % 10 ? ' ' + ONES[num % 10] : '');
    if (num < 1000) return ONES[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  return convert(n);
}

export function amountInWords(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const remaining = paise % 100;
  let result = numberToWords(rupees) + ' Rupees';
  if (remaining > 0) result += ' and ' + numberToWords(remaining) + ' Paisa';
  return result + ' Only';
}

// ——— Types ———
export type ReceiptHeadItem = {
  name: string;
  amountPaise: number;
};

export type ReceiptMonthSection = {
  label: string;
  breakdown: ReceiptHeadItem[];
  extraItems: ReceiptHeadItem[];
  totalPaise: number;
  paidPaise: number;
};

export type ReceiptData = {
  receiptNumber: string;
  date: string;
  paymentMethod: string;
  reference?: string;
  totalPaidPaise: number;
  balanceRemainingPaise: number;
  studentName: string;
  studentClass: string;
  studentRoll?: string;
  fatherName?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  isFullyPaid: boolean;

  /** Current month — shown with full breakdown */
  currentMonth?: ReceiptMonthSection;
  /** Sum of all previous unpaid months (shown as one line) */
  previousBalancePaise?: number;
  /** Total due before this payment (current + previous) */
  totalDuePaise?: number;

  /** Fallback: simple allocation list for family-pay etc. */
  allocations?: { label: string; amountPaise: number }[];
};

// ——— Styles ———
const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt { max-width: 800px; margin: 0 auto; padding: 32px; }

  /* Header */
  .header { text-align: center; padding-bottom: 20px; border-bottom: 3px double #c8a96e; margin-bottom: 20px; }
  .header h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; letter-spacing: 1px; text-transform: uppercase; }
  .header .sub { font-size: 11px; color: #666; margin-top: 4px; }
  .header .contact { font-size: 10px; color: #888; margin-top: 2px; }

  /* Receipt Title */
  .receipt-title { text-align: center; margin-bottom: 20px; }
  .receipt-title h2 { font-size: 16px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #c8a96e; display: inline-block; padding: 4px 24px; border-radius: 2px; }

  /* Receipt Meta Row */
  .meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 12px 16px; background: #f8f6f3; border-left: 4px solid #c8a96e; }
  .meta-row .receipt-no { font-size: 13px; }
  .meta-row .receipt-no strong { font-size: 15px; color: #c8a96e; }
  .meta-row .date { font-size: 12px; color: #555; }

  /* Info Section */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .info-card { padding: 10px 14px; background: #fafafa; border: 1px solid #e8e4df; border-radius: 4px; }
  .info-card .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 2px; }
  .info-card .value { font-size: 13px; color: #1a1a1a; font-weight: 500; }

  /* Section Headers */
  .section-title { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; margin-top: 20px; padding-bottom: 4px; border-bottom: 1px solid #e0d8cc; }
  .section-title:first-of-type { margin-top: 0; }
  .section-title .months-badge { font-size: 10px; font-weight: 400; color: #888; margin-left: 6px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 12px; }
  thead th { background: #c8a96e; color: #fff; padding: 7px 12px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  thead.th-right th:last-child, thead.th-right th:nth-child(2) { text-align: right; }
  tbody td { padding: 6px 12px; border-bottom: 1px solid #eee; }
  tbody td:last-child { text-align: right; font-weight: 500; }
  tbody td:nth-child(2) { text-align: right; }
  tbody .sub-item td { padding: 3px 12px 3px 24px; font-size: 11px; color: #555; }
  tbody .sub-item td:last-child { font-weight: 400; color: #666; }
  tbody .sub-extra td { padding: 3px 12px 3px 24px; font-size: 11px; color: #d97706; }
  tbody .sub-extra td:last-child { font-weight: 400; color: #d97706; }
  tbody .total-row td { padding: 8px 12px; font-weight: 700; border-top: 2px solid #c8a96e; border-bottom: 2px solid #c8a96e; background: #f8f6f3; }
  tbody .total-row td:last-child { color: #1a1a1a; font-size: 13px; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:last-of-type td { border-bottom: 2px solid #c8a96e; }
  tbody tr:nth-child(even) { background: #fafafa; }

  /* Summary blocks */
  .summary-block { margin-top: 16px; }
  .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; }
  .summary-row .lbl { font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-row .val { font-size: 14px; font-weight: 600; color: #1a1a1a; }
  .summary-row .val.green { color: #16a34a; }
  .summary-row .val.red { color: #dc2626; }

  .summary-divider { height: 1px; background: #e0d8cc; margin: 0 14px; }

  .summary-total { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #c8a96e; color: #fff; border-radius: 4px; margin-top: 8px; }
  .summary-total .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
  .summary-total .val { font-size: 18px; font-weight: 700; }

  .balance-block { margin: 16px 0; padding: 14px 16px; border-radius: 6px; }
  .balance-block.cleared { background: #f0fdf4; border: 1px solid #86efac; }
  .balance-block.due { background: #fef2f2; border: 1px solid #fca5a5; }
  .balance-block .balance-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .balance-block .balance-label.cleared-label { color: #16a34a; }
  .balance-block .balance-label.due-label { color: #dc2626; }
  .balance-block .balance-value { font-size: 20px; font-weight: 700; }
  .balance-block .balance-value.cleared-val { color: #15803d; }
  .balance-block .balance-value.due-val { color: #b91c1c; }

