/**
 * Family combined receipt — same chrome as single-student (collection) receipts.
 */

export { amountInWords } from './receiptShared';
import {
  RECEIPT_STYLES,
  fmtPaise,
  renderSchoolHeader,
  renderMetaRow,
  renderLineTable,
  renderSummaryBlock,
  renderPayDetails,
  renderSignatures,
  renderTearOff,
  renderFooter,
  barcodeScript,
  FAMILY_TEMPLATE_TITLES,
  type ReceiptLine,
  type ReceiptTemplateType,
} from './receiptShared';

export type FamilyReceiptLine = ReceiptLine;

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
  templateType: ReceiptTemplateType;
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

function renderStudentBlock(data: FamilyReceiptData, s: FamilyReceiptStudent): string {
  const showRemaining = data.templateType === 'CONTINUATION';
  const showPrevious = data.templateType !== 'FIRST' && s.previousMonths.length > 0;

  let body = '';

  if (showPrevious) {
    body += `<div class="section-label">Previous Months / Arrears</div>`;
    body += `<table><thead><tr><th>Month</th><th class="num">Due</th><th class="num">Paid Now</th></tr></thead><tbody>`;
    for (const m of s.previousMonths) {
      body += `<tr><td>${m.label}</td><td class="num">${fmtPaise(m.amountPaise)}</td><td class="num paid">${fmtPaise(m.paidPaise)}</td></tr>`;
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
      body += `<table><tbody><tr><td>${cm.label}</td><td class="num paid">${fmtPaise(cm.paidPaise)}</td></tr></tbody></table>`;
    }
  }

  body += `<div class="student-total">
    <span>Paid for ${s.name}</span>
    <span class="paid">${fmtPaise(s.amountPaidPaise)} PKR</span>
  </div>`;

  if (showRemaining && s.balanceAfterPaise > 0) {
    body += `<div class="student-total" style="font-weight:400;color:#888"><span>Balance remaining</span><span class="due">${fmtPaise(s.balanceAfterPaise)} PKR</span></div>`;
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
  const title = FAMILY_TEMPLATE_TITLES[data.templateType];
  const barcodeId = `fam-barcode-${data.receiptNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const paidBadge = data.isFullyPaid ? '<span class="paid-badge">Paid in Full</span>' : '';
  const templateBadge = `<span class="template-badge">${data.templateType}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${data.receiptNumber}</title><style>${RECEIPT_STYLES}</style></head>
<body>
<div class="receipt">
  ${renderSchoolHeader()}
  <div class="receipt-title"><h2>${title}${templateBadge}${paidBadge}</h2></div>
  ${renderMetaRow(data.receiptNumber, dateStr)}
  <div class="info-grid cols-3">
    <div class="info-card"><div class="label">Family</div><div class="value">${data.familyName}</div></div>
    <div class="info-card"><div class="label">Father / Contact</div><div class="value">${data.fatherName || '—'}${data.phone ? '<br><span style="font-size:11px;color:#888">' + data.phone + '</span>' : ''}</div></div>
    <div class="info-card"><div class="label">Students</div><div class="value">${data.students.length} in this payment</div></div>
  </div>
  ${data.students.map(s => renderStudentBlock(data, s)).join('')}
  ${renderSummaryBlock({
    totalDuePaise: data.totalDuePaise,
    amountPaidPaise: data.amountPaidPaise,
    balanceRemainingPaise: data.balanceAfterPaise,
    balanceLabel: 'Family Balance Remaining',
  })}
  ${renderPayDetails(data.paymentMethod, data.reference)}
  ${renderSignatures()}
  ${renderTearOff(data.receiptNumber, barcodeId, 'Family Copy')}
  ${renderFooter(data.receiptNumber, data.printCount)}
</div>
${barcodeScript(barcodeId, data.receiptNumber)}
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
