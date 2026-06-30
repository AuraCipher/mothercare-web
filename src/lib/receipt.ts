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


  /* Payment details */
  .pay-details { display: flex; gap: 20px; margin: 14px 0 0; font-size: 11px; color: #555; }
  .pay-details span strong { color: #1a1a1a; }

  /* Tear off */
  .tear-off { margin-top: 24px; border-top: 2px dashed #ccc; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .tear-off .copy-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; }
  .tear-off .tear-receipt-no { font-size: 12px; font-weight: 600; color: #333; }
  .tear-off .barcode-wrap { text-align: right; }
  .tear-off .barcode-wrap svg { max-width: 200px; height: auto; }

  /* Signature */
  .signatures { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
  .signatures .sig-block { text-align: center; min-width: 150px; }
  .signatures .sig-block .line { border-top: 1px solid #333; width: 150px; margin: 28px auto 4px; }
  .signatures .sig-block .sig-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Footer */
  .footer { text-align: center; margin-top: 20px; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
  .footer .thank { font-size: 11px; color: #c8a96e; font-weight: 500; margin-bottom: 4px; }

  /* Fully paid badge */
  .paid-badge { display: inline-block; background: #16a34a; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 2px; letter-spacing: 1px; text-transform: uppercase; margin-left: 8px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 10mm 10mm; size: A4 portrait; }
    .receipt { page-break-inside: avoid; }
    .no-print { display: none; }
  }
`;

// ——— HTML builder ———
function buildReceiptHtml(data: ReceiptData): string {
  const fmt = (paise: number) => (paise / 100).toLocaleString(undefined, { minimumFractionDigits: 0 });
  const barcodeId = `barcode-${data.receiptNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Build fee breakdown table for current month
  const cm = data.currentMonth;
  let feeTableHtml = '';

  if (cm) {
    // Current month section
    feeTableHtml += `<div class="section-title">Current Month Fee <span class="months-badge">— ${cm.label}</span></div>`;
    feeTableHtml += `<table><thead class="th-right"><tr><th>Fee Head</th><th style="text-align:right">Amount</th></tr></thead><tbody>`;

    // Fee head breakdown
    if (cm.breakdown && cm.breakdown.length > 0) {
      for (const h of cm.breakdown) {
        feeTableHtml += `<tr class="sub-item"><td>${h.name}</td><td>${fmt(h.amountPaise)}</td></tr>`;
      }
    } else {
      feeTableHtml += `<tr class="sub-item"><td>Base Fee</td><td>${fmt(cm.totalPaise)}</td></tr>`;
    }

    // Extra items
    if (cm.extraItems && cm.extraItems.length > 0) {
      for (const e of cm.extraItems) {
        feeTableHtml += `<tr class="sub-extra"><td>${e.name} <span style="font-size:9px;color:#999">(extra)</span></td><td>+${fmt(e.amountPaise)}</td></tr>`;
      }
    }

    // Current month total row
    feeTableHtml += `<tr class="total-row"><td>Current Month Total</td><td>${fmt(cm.totalPaise)}</td></tr>`;
    feeTableHtml += `</tbody></table>`;
  }

  // Previous balance section
  if (data.previousBalancePaise !== undefined && data.previousBalancePaise > 0) {
    feeTableHtml += `<div class="section-title">Previous Balance</div>`;
    feeTableHtml += `<table><tbody>`;
    feeTableHtml += `<tr><td>Unpaid fees from earlier months</td><td style="color:#b91c1c">${fmt(data.previousBalancePaise)}</td></tr>`;
    feeTableHtml += `</tbody></table>`;
  }

  // Total due row — before payment
  if (data.totalDuePaise !== undefined) {
    feeTableHtml += `
      <div class="summary-block">
        <div class="summary-row">
          <span class="lbl">Total Due (Before Payment)</span>
          <span class="val">${fmt(data.totalDuePaise)} PKR</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row">
          <span class="lbl">Amount Paid</span>
          <span class="val green">— ${fmt(data.totalPaidPaise)} PKR</span>
        </div>
    `;

    // Allocation breakdown (if provided)
    if (data.allocations && data.allocations.length > 0) {
      for (const a of data.allocations) {
        feeTableHtml += `
          <div class="summary-row" style="padding:2px 14px">
            <span class="lbl" style="font-size:10px;color:#888">${a.label}</span>
            <span class="val" style="font-size:11px;color:#16a34a">${fmt(a.amountPaise)}</span>
          </div>
        `;
      }
    }

    // Balance block
    const isCleared = data.balanceRemainingPaise <= 0;
    feeTableHtml += `
        <div class="balance-block ${isCleared ? 'cleared' : 'due'}">
          <div class="balance-label ${isCleared ? 'cleared-label' : 'due-label'}">Balance Remaining</div>
          <div class="balance-value ${isCleared ? 'cleared-val' : 'due-val'}">
            ${isCleared ? '✅ CLEARED' : fmt(data.balanceRemainingPaise) + ' PKR'}
          </div>
          
        </div>
      </div>
    `;
  }

  // Fallback: simple allocation list (for family-pay, non-student receipts)
  if (!cm && !data.totalDuePaise && data.allocations && data.allocations.length > 0) {
    feeTableHtml = `<table><thead class="th-right"><tr><th>Description</th><th style="text-align:right">Amount (PKR)</th></tr></thead><tbody>`;
    for (const a of data.allocations) {
      feeTableHtml += `<tr><td>${a.label}</td><td>${fmt(a.amountPaise)}</td></tr>`;
    }
    feeTableHtml += `<tr class="total-row"><td>Total Paid</td><td style="color:#16a34a">${fmt(data.totalPaidPaise)}</td></tr>`;
    feeTableHtml += `</tbody></table>`;

    // Simple balance for fallback
    feeTableHtml += `
      <div class="summary-block">
        <div class="balance-block ${data.balanceRemainingPaise === 0 ? 'cleared' : 'due'}">
          <div class="balance-label ${data.balanceRemainingPaise === 0 ? 'cleared-label' : 'due-label'}">Balance Remaining</div>
          <div class="balance-value ${data.balanceRemainingPaise === 0 ? 'cleared-val' : 'due-val'}">
            ${data.balanceRemainingPaise === 0 ? '✅ CLEARED' : fmt(data.balanceRemainingPaise) + ' PKR'}
          </div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8">
<title>Receipt ${data.receiptNumber}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="receipt">

  <!-- School Header -->
  <div class="header">
    <h1>${data.schoolName || 'Mother Care School'}</h1>
    <div class="sub">${data.schoolAddress || 'Sohan, Islamabad'}</div>
    <div class="contact">${data.schoolPhone ? 'Phone: ' + data.schoolPhone : ''} &nbsp;|&nbsp; Email: info@mothercareschool.edu.pk</div>
  </div>

  <!-- Receipt Title -->
  <div class="receipt-title">
    <h2>Payment Receipt ${data.isFullyPaid ? '<span class="paid-badge">Paid in Full</span>' : ''}</h2>
  </div>

  <!-- Meta Row -->
  <div class="meta-row">
    <div class="receipt-no">Receipt #: <strong>${data.receiptNumber}</strong></div>
    <div class="date">Date: <strong>${data.date}</strong></div>
  </div>

  <!-- Student Info -->
  <div class="info-grid">
    <div class="info-card">
      <div class="label">Student Name</div>
      <div class="value">${data.studentName}</div>
    </div>
    <div class="info-card">
      <div class="label">Class / Roll</div>
      <div class="value">${data.studentClass}${data.studentRoll ? ' — ' + data.studentRoll : ''}</div>
    </div>
  </div>

  <!-- Fee Breakdown + Summary -->
  ${feeTableHtml}

  <!-- Amount in Words -->

  <!-- Payment Details -->
  <div class="pay-details">
    <span>Method: <strong>${data.paymentMethod}</strong></span>
    ${data.reference ? `<span>Ref #: <strong>${data.reference}</strong></span>` : ''}
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-block"><div class="line"></div><div class="sig-label">Received By</div></div>
    <div class="sig-block"><div class="line"></div><div class="sig-label">Authorized By</div></div>
  </div>

  <!-- Tear-off + Barcode -->
  <div class="tear-off">
    <div>
      <div class="copy-label">Student Copy</div>
      <div class="tear-receipt-no">${data.receiptNumber}</div>
    </div>
    <div class="barcode-wrap">
      <svg id="${barcodeId}"></svg>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="thank">Thank you for your payment</div>
    This is a computer-generated receipt. No signature is required.
  </div>

</div>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
  JsBarcode("#${barcodeId}", "${data.receiptNumber}", {
    format: "CODE128",
    width: 1.5,
    height: 40,
    displayValue: false,
    background: "transparent",
    lineColor: "#1a1a1a",
    margin: 0
  });
</script>
</body></html>`;
}

/** Opens a print window with the upgraded receipt */
export function printReceipt(data: ReceiptData) {
  const win = window.open('', '_blank');
  if (!win) return;
  const html = buildReceiptHtml(data);
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}

/** Download the receipt as an HTML file */
export function downloadReceipt(data: ReceiptData) {
  const html = buildReceiptHtml(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt_${data.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Both print and download the receipt */
export function printAndDownloadReceipt(data: ReceiptData) {
  downloadReceipt(data);
  printReceipt(data);
}
