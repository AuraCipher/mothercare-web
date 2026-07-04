/**
 * Family combined receipt — three templates: FIRST | ARREARS | CONTINUATION
 */

import { amountInWords } from './receipt';

export type FamilyReceiptLine = {
  name: string;
  dueBeforePaise: number;
  paidPaise: number;
  remainingPaise: number;
};

export type FamilyReceiptStudent = {
  name: string;
  class: string;
  rollNumber?: string | null;
  previousMonths: { label: string; amountPaise: number; paidPaise: number }[];
  previousBalancePaise: number;
  currentMonth?: {
    label: string;
    heads: FamilyReceiptLine[];
    extras: FamilyReceiptLine[];
    totalDueBeforePaise: number;
    paidPaise: number;
    remainingPaise: number;
  };
  amountPaidPaise: number;
  totalDueBeforePaise?: number;
  balanceAfterPaise: number;
};

export type FamilyReceiptData = {
  templateType: 'FIRST' | 'ARREARS' | 'CONTINUATION';
  receiptNumber: string;
  familyName: string;
  fatherName?: string | null;
  phone?: string | null;
  paymentMethod: string;
  reference?: string | null;
  paymentDate: string;
  totalDuePaise: number;
  amountPaidPaise: number;
  balanceAfterPaise: number;
  isFullyPaid: boolean;
  students: FamilyReceiptStudent[];
  printCount?: number;
};

const TEMPLATE_TITLES: Record<FamilyReceiptData['templateType'], string> = {
  FIRST: 'Family Fee Receipt — First Payment',
  ARREARS: 'Family Fee Receipt — Monthly & Arrears',
  CONTINUATION: 'Family Fee Receipt — Additional Payment',
};

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .receipt { max-width: 820px; margin: 0 auto; padding: 32px; }
  .header { text-align: center; padding-bottom: 18px; border-bottom: 3px double #c8a96e; margin-bottom: 18px; }
  .header h1 { font-size: 22px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .header .sub { font-size: 11px; color: #666; margin-top: 4px; }
  .receipt-title { text-align: center; margin-bottom: 16px; }
  .receipt-title h2 { font-size: 15px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid #c8a96e; display: inline-block; padding: 5px 20px; }
  .template-badge { display: inline-block; margin-left: 8px; font-size: 9px; background: #f5efe6; color: #8b6914; padding: 2px 8px; border-radius: 10px; vertical-align: middle; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-row { display: flex; justify-content: space-between; padding: 12px 16px; background: #f8f6f3; border-left: 4px solid #c8a96e; margin-bottom: 16px; font-size: 12px; }
  .meta-row strong { color: #c8a96e; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .info-card { padding: 10px 12px; background: #fafafa; border: 1px solid #e8e4df; border-radius: 4px; }
  .info-card .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 2px; }
  .info-card .value { font-size: 13px; font-weight: 500; }
  .student-block { margin-bottom: 20px; border: 1px solid #e8e4df; border-radius: 6px; overflow: hidden; }
  .student-header { background: #c8a96e; color: #fff; padding: 8px 14px; font-size: 12px; font-weight: 600; display: flex; justify-content: space-between; }
  .student-body { padding: 12px 14px; }
  .section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 10px 0 6px; }
  .section-label:first-child { margin-top: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
  th { background: #f0ebe3; padding: 5px 10px; text-align: left; font-size: 9px; text-transform: uppercase; color: #666; }
  th.num { text-align: right; }
  td { padding: 5px 10px; border-bottom: 1px solid #f0ebe3; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .paid { color: #16a34a; }
  .due { color: #b91c1c; }
  .rem { color: #888; font-size: 10px; }
  .student-total { display: flex; justify-content: space-between; padding: 8px 0 0; border-top: 1px dashed #ddd; font-size: 11px; font-weight: 600; margin-top: 6px; }
  .summary-block { margin-top: 20px; padding: 14px 16px; background: #f8f6f3; border: 1px solid #e8e4df; border-radius: 6px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .summary-row.total { font-size: 14px; font-weight: 700; border-top: 2px solid #c8a96e; margin-top: 8px; padding-top: 10px; }
  .words { font-size: 11px; color: #555; font-style: italic; margin-top: 10px; text-align: center; }
  .pay-details { text-align: center; font-size: 11px; color: #666; margin: 16px 0; }
  .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #ddd; }
`;

function fmt(paise: number) {
  return (paise / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function renderLineTable(lines: FamilyReceiptLine[], showRemaining: boolean) {
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
        <td class="num">${fmt(l.dueBeforePaise)}</td>
        <td class="num paid">${fmt(l.paidPaise)}</td>
        ${showRemaining ? `<td class="num rem">${fmt(l.remainingPaise)}</td>` : ''}
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function renderStudentBlock(data: FamilyReceiptData, s: FamilyReceiptStudent) {
  const isContinuation = data.templateType === 'CONTINUATION';
  const showRemaining = isContinuation;
  const showPrevious = data.templateType !== 'FIRST' && s.previousMonths.length > 0;

  let body = '';

  if (showPrevious) {
    body += `<div class="section-label">Previous Months / Arrears</div>`;
    body += `<table><thead><tr><th>Month</th><th class="num">Due</th><th class="num">Paid Now</th></tr></thead><tbody>`;
    for (const m of s.previousMonths) {
      body += `<tr><td>${m.label}</td><td class="num">${fmt(m.amountPaise)}</td><td class="num paid">${fmt(m.paidPaise)}</td></tr>`;
    }
    body += `</tbody></table>`;
  }

  if (s.currentMonth) {
    const cm = s.currentMonth;
    body += `<div class="section-label">Current Month — ${cm.label}</div>`;
    body += renderLineTable(cm.heads, showRemaining);
    if (cm.extras.length > 0) {
      body += `<div class="section-label" style="margin-top:6px">Extra Items</div>`;
      body += renderLineTable(cm.extras, showRemaining);
    }
    if (data.templateType === 'FIRST' && cm.heads.length === 0 && cm.extras.length === 0) {
      body += `<table><tbody><tr><td>${cm.label}</td><td class="num paid">${fmt(cm.paidPaise)}</td></tr></tbody></table>`;
    }
  }

  body += `<div class="student-total">
    <span>Paid for ${s.name}</span>
    <span class="paid">${fmt(s.amountPaidPaise)} PKR</span>
  </div>`;

  if (isContinuation && s.balanceAfterPaise > 0) {
    body += `<div class="student-total" style="font-weight:400;color:#888"><span>Balance remaining</span><span class="due">${fmt(s.balanceAfterPaise)} PKR</span></div>`;
  }

  return `<div class="student-block">
    <div class="student-header">
      <span>${s.name}</span>
      <span>${s.class}${s.rollNumber ? ' · Roll ' + s.rollNumber : ''}</span>
    </div>
    <div class="student-body">${body}</div>
  </div>`;
}

export function buildFamilyReceiptHtml(data: FamilyReceiptData): string {
  const dateStr = new Date(data.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const title = TEMPLATE_TITLES[data.templateType];
  const barcodeId = 'fam-barcode-' + Math.random().toString(36).slice(2, 8);
  const cleared = data.balanceAfterPaise <= 0;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${data.receiptNumber}</title><style>${STYLES}</style></head>
<body>
<div class="receipt">
  <div class="header">
    <h1>Mother Care School</h1>
    <div class="sub">Sohan, Islamabad</div>
  </div>
  <div class="receipt-title">
    <h2>${title}<span class="template-badge">${data.templateType}</span></h2>
  </div>
  <div class="meta-row">
    <div>Receipt #: <strong>${data.receiptNumber}</strong></div>
    <div>Date: <strong>${dateStr}</strong></div>
  </div>
  <div class="info-grid">
    <div class="info-card"><div class="label">Family</div><div class="value">${data.familyName}</div></div>
    <div class="info-card"><div class="label">Father / Contact</div><div class="value">${data.fatherName || '—'}${data.phone ? '<br><span style="font-size:11px;color:#888">' + data.phone + '</span>' : ''}</div></div>
    <div class="info-card"><div class="label">Students</div><div class="value">${data.students.length} in this payment</div></div>
  </div>
  ${data.students.map(s => renderStudentBlock(data, s)).join('')}
  <div class="summary-block">
    <div class="summary-row"><span>Total Due (Before Payment)</span><span>${fmt(data.totalDuePaise)} PKR</span></div>
    <div class="summary-row"><span class="paid">Amount Paid</span><span class="paid">— ${fmt(data.amountPaidPaise)} PKR</span></div>
    <div class="summary-row total"><span>Family Balance Remaining</span><span class="${cleared ? 'paid' : 'due'}">${cleared ? '✅ ALL CLEARED' : fmt(data.balanceAfterPaise) + ' PKR'}</span></div>
    <div class="words">${amountInWords(data.amountPaidPaise)}</div>
  </div>
  <div class="pay-details">Method: <strong>${data.paymentMethod}</strong>${data.reference ? ` &nbsp;|&nbsp; Ref: <strong>${data.reference}</strong>` : ''}</div>
  <div style="text-align:center;margin:16px 0"><svg id="${barcodeId}"></svg></div>
  <div class="footer">Computer-generated family receipt · ${data.receiptNumber}${data.printCount ? ' · Print #' + data.printCount : ''}</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>JsBarcode("#${barcodeId}", "${data.receiptNumber}", { format: "CODE128", width: 1.5, height: 40, displayValue: false, margin: 0 });</script>
</body></html>`;
}

export function printFamilyReceipt(data: FamilyReceiptData) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(buildFamilyReceiptHtml(data));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}

export function downloadFamilyReceipt(data: FamilyReceiptData) {
  const html = buildFamilyReceiptHtml(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family_receipt_${data.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchAndPrintFamilyReceipt(
  familyPaymentId: string,
  token: string,
  apiUrl: string,
  action: 'print' | 'download',
) {
  const res = await fetch(`${apiUrl}/admin/family-payments/${familyPaymentId}/receipt`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success || !json.data?.snapshot) {
    throw new Error(json.message || 'Family receipt not available');
  }
  const snap = json.data.snapshot as FamilyReceiptData;
  snap.printCount = json.data.printCount;
  if (action === 'print') printFamilyReceipt(snap);
  else downloadFamilyReceipt(snap);
  await fetch(`${apiUrl}/admin/family-payments/${familyPaymentId}/print-receipt`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}
