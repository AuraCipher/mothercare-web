/**
 * Single-student (collection) receipt — shares chrome with family receipts.
 */

export { amountInWords } from './receiptShared';
import {
  RECEIPT_STYLES,
  fmtPaise,
  normalizeReceiptLine,
  renderSchoolHeader,
  renderMetaRow,
  renderLineTable,
  renderPreviousMonthsTable,
  renderSummaryBlock,
  renderPayDetails,
  renderSignatures,
  renderTearOff,
  renderFooter,
  barcodeScript,
  STUDENT_TEMPLATE_TITLES,
  type ReceiptLine,
  type ReceiptTemplateType,
} from './receiptShared';

// ——— Types ———
export type ReceiptHeadItem = ReceiptLine & { amountPaise?: number };

export type ReceiptMonthSection = {
  label: string;
  breakdown: ReceiptHeadItem[];
  extraItems: ReceiptHeadItem[];
  totalPaise: number;
  paidPaise: number;
  remainingPaise?: number;
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
  templateType?: ReceiptTemplateType;

  isFromSnapshot?: boolean;
  snapshotCreatedAt?: string;
  snapshotPrintCount?: number;

  currentMonth?: ReceiptMonthSection;
  previousBalancePaise?: number;
  previousMonths?: { label: string; dueBeforePaise?: number; amountPaise?: number; paidPaise: number }[];
  totalDuePaise?: number;
  allocations?: { label: string; amountPaise: number }[];
};

function inferTemplateType(data: ReceiptData): ReceiptTemplateType {
  if (data.templateType) return data.templateType;
  if (data.previousMonths && data.previousMonths.length > 0) return 'ARREARS';
  if (data.previousBalancePaise && data.previousBalancePaise > 0) return 'ARREARS';
  const cm = data.currentMonth;
  if (cm) {
    const hasRemaining = [...cm.breakdown, ...cm.extraItems].some(
      h => (h.remainingPaise ?? Math.max(0, (h.dueBeforePaise ?? h.amountPaise ?? 0) - (h.paidPaise ?? 0))) > 0,
    );
    const hasPriorPaid = [...cm.breakdown, ...cm.extraItems].some(h => (h.paidPaise ?? 0) > 0 && hasRemaining);
    if (hasPriorPaid) return 'CONTINUATION';
  }
  return 'FIRST';
}

function buildReceiptHtml(data: ReceiptData): string {
  const templateType = inferTemplateType(data);
  const showRemaining = templateType === 'CONTINUATION';
  const title = STUDENT_TEMPLATE_TITLES[templateType];
  const barcodeId = `barcode-${data.receiptNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;

  let feeTableHtml = '';
  const cm = data.currentMonth;

  // Previous months detail (preferred) or single balance line
  if (data.previousMonths && data.previousMonths.length > 0) {
    feeTableHtml += renderPreviousMonthsTable(data.previousMonths);
  } else if (data.previousBalancePaise !== undefined && data.previousBalancePaise > 0) {
    feeTableHtml += renderPreviousMonthsTable([{
      label: 'Unpaid fees from earlier months',
      dueBeforePaise: data.previousBalancePaise,
      paidPaise: 0,
    }]);
  }

  if (cm) {
    feeTableHtml += `<div class="section-title">Current Month Fee <span class="months-badge">— ${cm.label}</span></div>`;
    const heads = cm.breakdown.map(normalizeReceiptLine);
    const extras = cm.extraItems.map(normalizeReceiptLine);

    if (heads.length > 0) {
      feeTableHtml += renderLineTable(heads, showRemaining);
    } else if (templateType === 'FIRST') {
      feeTableHtml += `<table><tbody><tr><td>${cm.label}</td><td class="num paid">${fmtPaise(cm.paidPaise || cm.totalPaise)}</td></tr></tbody></table>`;
    }

    if (extras.length > 0) {
      feeTableHtml += `<div class="section-label">Extra Items</div>`;
      feeTableHtml += renderLineTable(extras, showRemaining);
    }

    if (heads.length > 0 || extras.length > 0) {
      feeTableHtml += `<table><tbody><tr class="total-row"><td>Current Month Total</td><td class="num">${fmtPaise(cm.totalPaise)}</td></tr></tbody></table>`;
    }
  }

  if (data.totalDuePaise !== undefined) {
    feeTableHtml += renderSummaryBlock({
      totalDuePaise: data.totalDuePaise,
      amountPaidPaise: data.totalPaidPaise,
      balanceRemainingPaise: data.balanceRemainingPaise,
      allocationRows: data.allocations,
    });
  } else if (!cm && data.allocations && data.allocations.length > 0) {
    feeTableHtml += `<table><thead><tr><th>Description</th><th class="num">Amount (PKR)</th></tr></thead><tbody>`;
    for (const a of data.allocations) {
      feeTableHtml += `<tr><td>${a.label}</td><td class="num paid">${fmtPaise(a.amountPaise)}</td></tr>`;
    }
    feeTableHtml += `<tr class="total-row"><td>Total Paid</td><td class="num paid">${fmtPaise(data.totalPaidPaise)}</td></tr></tbody></table>`;
    feeTableHtml += renderSummaryBlock({
      totalDuePaise: data.totalPaidPaise,
      amountPaidPaise: data.totalPaidPaise,
      balanceRemainingPaise: data.balanceRemainingPaise,
      showAmountInWords: true,
    });
  }

  const paidBadge = data.isFullyPaid ? '<span class="paid-badge">Paid in Full</span>' : '';
  const templateBadge = `<span class="template-badge">${templateType}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Receipt ${data.receiptNumber}</title><style>${RECEIPT_STYLES}</style></head>
<body>
<div class="receipt">
  ${renderSchoolHeader({ schoolName: data.schoolName, schoolAddress: data.schoolAddress, schoolPhone: data.schoolPhone })}
  <div class="receipt-title"><h2>${title}${templateBadge}${paidBadge}</h2></div>
  ${renderMetaRow(data.receiptNumber, data.date)}
  <div class="info-grid cols-2">
    <div class="info-card"><div class="label">Student Name</div><div class="value">${data.studentName}</div></div>
    <div class="info-card"><div class="label">Class / Roll</div><div class="value">${data.studentClass}${data.studentRoll ? ' — ' + data.studentRoll : ''}</div></div>
    ${data.fatherName ? `<div class="info-card"><div class="label">Father</div><div class="value">${data.fatherName}</div></div>` : ''}
  </div>
  ${feeTableHtml}
  ${renderPayDetails(data.paymentMethod, data.reference)}
  ${renderSignatures()}
  ${renderTearOff(data.receiptNumber, barcodeId, 'Student Copy')}
  ${renderFooter(data.receiptNumber, data.snapshotPrintCount)}
</div>
${barcodeScript(barcodeId, data.receiptNumber)}
</body></html>`;
}

export function printReceipt(data: ReceiptData) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(buildReceiptHtml(data));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}

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

export function printAndDownloadReceipt(data: ReceiptData) {
  downloadReceipt(data);
  printReceipt(data);
}

/** Map a backend PaymentReceipt snapshot to ReceiptData for printing */
export function receiptDataFromSnapshot(snap: any): ReceiptData {
  const normalizeItems = (items: any[]) => (items || []).map(normalizeReceiptLine);
  const heads = normalizeItems(snap.currentMonthHeads);
  const extras = normalizeItems(snap.currentMonthExtras);
  const allocations = Array.isArray(snap.allocations) && snap.allocations.length > 0
    ? snap.allocations
    : snap.currentMonthLabel
      ? [{ label: snap.currentMonthLabel, amountPaise: snap.amountPaidPaise }]
      : [];
  const totalPaise = heads.reduce((s, h) => s + h.dueBeforePaise, 0) + extras.reduce((s, e) => s + e.dueBeforePaise, 0);

  return {
    receiptNumber: snap.receiptNumber,
    date: new Date(snap.paymentDate || snap.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    paymentMethod: snap.paymentMethod,
    reference: snap.reference || undefined,
    totalPaidPaise: snap.amountPaidPaise,
    balanceRemainingPaise: snap.balanceAfterPaise,
    studentName: snap.studentName,
    studentClass: snap.studentClass,
    studentRoll: snap.studentRoll || undefined,
    fatherName: snap.fatherName || undefined,
    isFullyPaid: snap.isFullyPaid,
    templateType: snap.templateType || undefined,
    isFromSnapshot: true,
    snapshotCreatedAt: snap.createdAt,
    snapshotPrintCount: snap.printCount,
    currentMonth: snap.currentMonthLabel ? {
      label: snap.currentMonthLabel,
      breakdown: heads,
      extraItems: extras,
      totalPaise: totalPaise || snap.currentMonthTotal || snap.amountPaidPaise,
      paidPaise: snap.amountPaidPaise,
    } : undefined,
    previousBalancePaise: snap.previousBalancePaise,
    previousMonths: Array.isArray(snap.previousMonths) ? snap.previousMonths : undefined,
    totalDuePaise: snap.totalDuePaise,
    allocations,
  };
}
