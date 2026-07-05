/**
 * Shared receipt chrome — used by single-student (collection) and family receipts
 * so both templates look identical in header, summary, signatures, tear-off, etc.
 */

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

export type ReceiptLine = {
  name: string;
  dueBeforePaise: number;
  paidPaise: number;
  remainingPaise: number;
};

export type ReceiptTemplateType = 'FIRST' | 'ARREARS' | 'CONTINUATION';

export const RECEIPT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt { max-width: 820px; margin: 0 auto; padding: 32px; }

  .header { text-align: center; padding-bottom: 20px; border-bottom: 3px double #c8a96e; margin-bottom: 20px; }
  .header h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; letter-spacing: 1px; text-transform: uppercase; }
  .header .sub { font-size: 11px; color: #666; margin-top: 4px; }
  .header .contact { font-size: 10px; color: #888; margin-top: 2px; }

  .receipt-title { text-align: center; margin-bottom: 20px; }
  .receipt-title h2 { font-size: 16px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #c8a96e; display: inline-block; padding: 4px 24px; border-radius: 2px; }
  .template-badge { display: inline-block; margin-left: 8px; font-size: 9px; background: #f5efe6; color: #8b6914; padding: 2px 8px; border-radius: 10px; vertical-align: middle; text-transform: uppercase; letter-spacing: 0.5px; }
  .paid-badge { display: inline-block; background: #16a34a; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 2px; letter-spacing: 1px; text-transform: uppercase; margin-left: 8px; }

  .meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 12px 16px; background: #f8f6f3; border-left: 4px solid #c8a96e; font-size: 12px; }
  .meta-row strong { color: #c8a96e; font-size: 14px; }

  .info-grid { display: grid; gap: 12px; margin-bottom: 20px; }
  .info-grid.cols-2 { grid-template-columns: 1fr 1fr; }
  .info-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
  .info-card { padding: 10px 14px; background: #fafafa; border: 1px solid #e8e4df; border-radius: 4px; }
  .info-card .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 2px; }
  .info-card .value { font-size: 13px; color: #1a1a1a; font-weight: 500; }

  .section-title { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; margin-top: 20px; padding-bottom: 4px; border-bottom: 1px solid #e0d8cc; }
  .section-title:first-of-type { margin-top: 0; }
  .section-title .months-badge { font-size: 10px; font-weight: 400; color: #888; margin-left: 6px; }
  .section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 10px 0 6px; }
  .section-label:first-child { margin-top: 0; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; }
  thead th { background: #c8a96e; color: #fff; padding: 7px 12px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody td { padding: 6px 12px; border-bottom: 1px solid #eee; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody .sub-extra td { color: #d97706; }
  tbody .total-row td { padding: 8px 12px; font-weight: 700; border-top: 2px solid #c8a96e; border-bottom: 2px solid #c8a96e; background: #f8f6f3; }
  .paid { color: #16a34a; }
  .due { color: #b91c1c; }
  .rem { color: #888; font-size: 11px; }

  .student-block { margin-bottom: 20px; border: 1px solid #e8e4df; border-radius: 6px; overflow: hidden; }
  .student-header { background: #c8a96e; color: #fff; padding: 8px 14px; font-size: 12px; font-weight: 600; display: flex; justify-content: space-between; }
  .student-body { padding: 12px 14px; }
  .student-total { display: flex; justify-content: space-between; padding: 8px 0 0; border-top: 1px dashed #ddd; font-size: 11px; font-weight: 600; margin-top: 6px; }

  .summary-block { margin-top: 16px; padding: 14px 16px; background: #f8f6f3; border: 1px solid #e8e4df; border-radius: 6px; }
  .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 12px; }
  .summary-row .lbl { color: #555; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; }
  .summary-row .val { font-size: 14px; font-weight: 600; color: #1a1a1a; }
  .summary-row .val.green { color: #16a34a; }
  .summary-row.total { font-size: 14px; font-weight: 700; border-top: 2px solid #c8a96e; margin-top: 8px; padding-top: 10px; }
  .summary-divider { height: 1px; background: #e0d8cc; margin: 4px 0; }
  .words { font-size: 11px; color: #555; font-style: italic; margin-top: 10px; text-align: center; }

  .balance-block { margin: 12px 0 0; padding: 14px 16px; border-radius: 6px; }
  .balance-block.cleared { background: #f0fdf4; border: 1px solid #86efac; }
  .balance-block.due { background: #fef2f2; border: 1px solid #fca5a5; }
  .balance-block .balance-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .balance-block .balance-label.cleared-label { color: #16a34a; }
  .balance-block .balance-label.due-label { color: #dc2626; }
  .balance-block .balance-value { font-size: 20px; font-weight: 700; }
  .balance-block .balance-value.cleared-val { color: #15803d; }
  .balance-block .balance-value.due-val { color: #b91c1c; }

  .pay-details { display: flex; gap: 20px; margin: 16px 0 0; font-size: 11px; color: #555; }
  .pay-details span strong { color: #1a1a1a; }

  .signatures { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
  .signatures .sig-block { text-align: center; min-width: 150px; }
  .signatures .sig-block .line { border-top: 1px solid #333; width: 150px; margin: 28px auto 4px; }
  .signatures .sig-block .sig-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }

  .tear-off { margin-top: 24px; border-top: 2px dashed #ccc; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .tear-off .copy-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; }
  .tear-off .tear-receipt-no { font-size: 12px; font-weight: 600; color: #333; }
  .tear-off .barcode-wrap svg { max-width: 200px; height: auto; }

  .footer { text-align: center; margin-top: 20px; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
  .footer .thank { font-size: 11px; color: #c8a96e; font-weight: 500; margin-bottom: 4px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 10mm 10mm; size: A4 portrait; }
    .receipt { page-break-inside: avoid; }
    .no-print { display: none; }
  }
`;

export function fmtPaise(paise: number): string {
  return (paise / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Normalize legacy snapshot shapes (amount / amountPaise) into ReceiptLine */
export function normalizeReceiptLine(item: any): ReceiptLine {
  const dueBeforePaise = item.dueBeforePaise ?? item.amountPaise ?? item.amount ?? 0;
  const paidPaise = item.paidPaise ?? 0;
  const remainingPaise = item.remainingPaise ?? Math.max(0, dueBeforePaise - paidPaise);
  return { name: item.name || 'Item', dueBeforePaise, paidPaise, remainingPaise };
}

export function renderSchoolHeader(opts?: {
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
}): string {
  const name = (opts?.schoolName || '').trim();
  const address = (opts?.schoolAddress || '').trim();
  const phone = opts?.schoolPhone?.trim() ? `Phone: ${opts.schoolPhone.trim()}` : '';
  const email = opts?.schoolEmail?.trim() ? `Email: ${opts.schoolEmail.trim()}` : '';
  const contact = [phone, email].filter(Boolean).join(' &nbsp;|&nbsp; ');
  if (!name && !address && !contact) return '';
  return `<div class="header">
    ${name ? `<h1>${name}</h1>` : ''}
    ${address ? `<div class="sub">${address}</div>` : ''}
    ${contact ? `<div class="contact">${contact}</div>` : ''}
  </div>`;
}

export function renderMetaRow(receiptNumber: string, date: string): string {
  return `<div class="meta-row">
    <div>Receipt #: <strong>${receiptNumber}</strong></div>
    <div>Date: <strong>${date}</strong></div>
  </div>`;
}

export function renderLineTable(lines: ReceiptLine[], showRemaining: boolean): string {
  if (lines.length === 0) return '';
  return `<table>
    <thead><tr>
      <th>Description</th>
      <th class="num">Due</th>
      <th class="num">Paid</th>
      ${showRemaining ? '<th class="num">Remaining</th>' : ''}
    </tr></thead>
    <tbody>
      ${lines.map(l => `<tr>
        <td>${l.name}</td>
        <td class="num">${fmtPaise(l.dueBeforePaise)}</td>
        <td class="num paid">${fmtPaise(l.paidPaise)}</td>
        ${showRemaining ? `<td class="num rem">${fmtPaise(l.remainingPaise)}</td>` : ''}
      </tr>`).join('')}
    </tbody>
  </table>`;
}

export function renderPreviousMonthsTable(
  months: { label: string; dueBeforePaise?: number; amountPaise?: number; paidPaise: number }[],
): string {
  if (months.length === 0) return '';
  return `<div class="section-title">Previous Months / Arrears</div>
    <table><thead><tr><th>Month</th><th class="num">Due</th><th class="num">Paid Now</th></tr></thead><tbody>
      ${months.map(m => {
        const due = m.dueBeforePaise ?? m.amountPaise ?? 0;
        return `<tr><td>${m.label}</td><td class="num">${fmtPaise(due)}</td><td class="num paid">${fmtPaise(m.paidPaise)}</td></tr>`;
      }).join('')}
    </tbody></table>`;
}

export function renderSummaryBlock(opts: {
  totalDuePaise: number;
  amountPaidPaise: number;
  balanceRemainingPaise: number;
  balanceLabel?: string;
  showAmountInWords?: boolean;
  allocationRows?: { label: string; amountPaise: number }[];
}): string {
  const cleared = opts.balanceRemainingPaise <= 0;
  const balanceLabel = opts.balanceLabel || 'Balance Remaining';
  let html = `<div class="summary-block">
    <div class="summary-row"><span class="lbl">Total Due (Before Payment)</span><span class="val">${fmtPaise(opts.totalDuePaise)} PKR</span></div>
    <div class="summary-divider"></div>
    <div class="summary-row"><span class="lbl">Amount Paid</span><span class="val green">— ${fmtPaise(opts.amountPaidPaise)} PKR</span></div>`;

  if (opts.allocationRows && opts.allocationRows.length > 0) {
    for (const a of opts.allocationRows) {
      html += `<div class="summary-row" style="padding:2px 0"><span class="lbl" style="font-size:10px;color:#888">${a.label}</span><span class="val green" style="font-size:12px">${fmtPaise(a.amountPaise)}</span></div>`;
    }
  }

  html += `<div class="balance-block ${cleared ? 'cleared' : 'due'}">
      <div class="balance-label ${cleared ? 'cleared-label' : 'due-label'}">${balanceLabel}</div>
      <div class="balance-value ${cleared ? 'cleared-val' : 'due-val'}">
        ${cleared ? '✅ CLEARED' : fmtPaise(opts.balanceRemainingPaise) + ' PKR'}
      </div>
    </div>`;

  if (opts.showAmountInWords !== false) {
    html += `<div class="words">${amountInWords(opts.amountPaidPaise)}</div>`;
  }

  html += `</div>`;
  return html;
}

export function renderPayDetails(paymentMethod: string, reference?: string | null): string {
  return `<div class="pay-details">
    <span>Method: <strong>${paymentMethod}</strong></span>
    ${reference ? `<span>Ref #: <strong>${reference}</strong></span>` : ''}
  </div>`;
}

export function renderSignatures(): string {
  return `<div class="signatures">
    <div class="sig-block"><div class="line"></div><div class="sig-label">Received By</div></div>
    <div class="sig-block"><div class="line"></div><div class="sig-label">Authorized By</div></div>
  </div>`;
}

export function renderTearOff(receiptNumber: string, barcodeId: string, copyLabel = 'Student Copy'): string {
  return `<div class="tear-off">
    <div>
      <div class="copy-label">${copyLabel}</div>
      <div class="tear-receipt-no">${receiptNumber}</div>
    </div>
    <div class="barcode-wrap"><svg id="${barcodeId}"></svg></div>
  </div>`;
}

export function renderFooter(receiptNumber: string, printCount?: number): string {
  const printNote = printCount ? ` · Print #${printCount}` : '';
  return `<div class="footer">
    <div class="thank">Thank you for your payment</div>
    This is a computer-generated receipt. No signature is required. · ${receiptNumber}${printNote}
  </div>`;
}

export function barcodeScript(barcodeId: string, receiptNumber: string): string {
  const safeId = barcodeId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const safeNum = receiptNumber.replace(/"/g, '\\"');
  return `<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
  JsBarcode("#${safeId}", "${safeNum}", {
    format: "CODE128", width: 1.5, height: 40, displayValue: false,
    background: "transparent", lineColor: "#1a1a1a", margin: 0
  });
</script>`;
}

export const STUDENT_TEMPLATE_TITLES: Record<ReceiptTemplateType, string> = {
  FIRST: 'Fee Receipt — First Payment',
  ARREARS: 'Fee Receipt — Monthly & Arrears',
  CONTINUATION: 'Fee Receipt — Additional Payment',
};

export const FAMILY_TEMPLATE_TITLES: Record<ReceiptTemplateType, string> = {
  FIRST: 'Family Fee Receipt — First Payment',
  ARREARS: 'Family Fee Receipt — Monthly & Arrears',
  CONTINUATION: 'Family Fee Receipt — Additional Payment',
};
