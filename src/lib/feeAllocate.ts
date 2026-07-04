const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export type AllocateItem =
  | { kind: 'previousMonth'; key: string; studentId: string; studentFeeId: string; label: string; duePaise: number; studentName?: string; monthLabel?: string }
  | { kind: 'head'; key: string; studentId: string; studentFeeId: string; feeHeadId?: string; headName: string; label: string; duePaise: number; stickerPaise: number; monthLabel: string; isPaid?: boolean; studentName?: string }
  | { kind: 'extra'; key: string; studentId: string; studentFeeId: string; feeExtraItemId: string; label: string; duePaise: number; stickerPaise: number; monthLabel: string; isPaid?: boolean; studentName?: string };

export function priorPaidMaps(fee: any) {
  const byHead = new Map<string, number>();
  const byExtra = new Map<string, number>();
  for (const a of fee.headAllocations || []) {
    if (a.feeHeadId) byHead.set(a.feeHeadId, (byHead.get(a.feeHeadId) || 0) + a.amount);
    if (a.feeExtraItemId) byExtra.set(a.feeExtraItemId, (byExtra.get(a.feeExtraItemId) || 0) + a.amount);
  }
  return { byHead, byExtra };
}

export function headRemainingPaise(fee: any, head: { feeHeadId?: string; name: string; amount: number }): number {
  const { byHead } = priorPaidMaps(fee);
  const allocSum = [...byHead.values()].reduce((s, v) => s + v, 0);
  if (head.feeHeadId && byHead.has(head.feeHeadId)) {
    return Math.max(0, head.amount - (byHead.get(head.feeHeadId) || 0));
  }
  if (allocSum > 0 && head.feeHeadId) {
    return Math.max(0, head.amount - (byHead.get(head.feeHeadId) || 0));
  }
  const heads = ((fee.feeHeadBreakdown as any[]) || []).filter((h: any) => (h.amount || 0) > 0);
  let paidLeft = fee.paidAmount || 0;
  for (const h of heads) {
    const applied = Math.min(paidLeft, h.amount || 0);
    if (h.feeHeadId === head.feeHeadId || h.name === head.name) {
      return Math.max(0, (head.amount || 0) - applied);
    }
    paidLeft = Math.max(0, paidLeft - (h.amount || 0));
  }
  return head.amount || 0;
}

export function extraRemainingPaise(fee: any, extra: { id: string; amount: number }): number {
  const { byExtra } = priorPaidMaps(fee);
  if (byExtra.has(extra.id)) {
    return Math.max(0, extra.amount - (byExtra.get(extra.id) || 0));
  }
  const headTotal = ((fee.feeHeadBreakdown as any[]) || []).reduce((s: number, h: any) => s + (h.amount || 0), 0);
  const allocExtraSum = [...byExtra.values()].reduce((s, v) => s + v, 0);
  const paidOnHeads = Math.min(fee.paidAmount || 0, headTotal);
  const paidOnExtras = Math.max(0, (fee.paidAmount || 0) - paidOnHeads - allocExtraSum);
  if (paidOnExtras <= 0) return extra.amount;
  let extraLeft = paidOnExtras;
  for (const e of fee.extraItems || []) {
    const applied = Math.min(extraLeft, e.amount || 0);
    if (e.id === extra.id) return Math.max(0, extra.amount - applied);
    extraLeft = Math.max(0, extraLeft - (e.amount || 0));
  }
  return extra.amount;
}

export function monthLabel(month: number, year: number) {
  return `${MONTHS[(month || 1) - 1]} ${year}`;
}

export function getFeeExtraTotal(fee: any) {
  return (fee.extraItems || []).reduce((s: number, e: any) => s + e.amount, 0);
}

export function getFeeMonthDue(fee: any) {
  return fee.netAmount + getFeeExtraTotal(fee) - fee.paidAmount;
}

/** Build allocation items for one student (same rules as single-student allocate page). */
export function buildAllocateItemsForStudent(studentId: string, studentName: string, studentFees: any[]): {
  currentMonthItems: AllocateItem[];
  previousItems: AllocateItem[];
  currentMonthLabel: string;
} {
  const fees = studentFees || [];
  const withDue = fees.filter(f => getFeeMonthDue(f) > 0);
  if (withDue.length === 0) {
    return { currentMonthItems: [], previousItems: [], currentMonthLabel: '' };
  }

  const sorted = [...withDue].sort((a, b) => (a.year - b.year) || (a.month - b.month));
  const currentFee = sorted[sorted.length - 1];
  const currentLabel = monthLabel(currentFee.month, currentFee.year);
  const previousFees = sorted.slice(0, -1);

  const previousItems: AllocateItem[] = previousFees.map(f => ({
    kind: 'previousMonth',
    key: `${studentId}:prev:${f.id}`,
    studentId,
    studentFeeId: f.id,
    label: monthLabel(f.month, f.year),
    duePaise: getFeeMonthDue(f),
    studentName,
    monthLabel: monthLabel(f.month, f.year),
  }));

  const currentMonthItems: AllocateItem[] = [
    ...((currentFee.feeHeadBreakdown as any[]) || [])
      .filter((h: any) => (h.amount || 0) > 0)
      .map((h: any) => {
        const remaining = headRemainingPaise(currentFee, { feeHeadId: h.feeHeadId, name: h.name, amount: h.amount || 0 });
        return {
          kind: 'head' as const,
          key: `${studentId}:head:${currentFee.id}:${h.feeHeadId || h.name}`,
          studentId,
          studentFeeId: currentFee.id,
          feeHeadId: h.feeHeadId,
          headName: h.name,
          label: h.name,
          duePaise: remaining,
          stickerPaise: h.amount || 0,
          monthLabel: currentLabel,
          isPaid: remaining <= 0,
          studentName,
        };
      }),
    ...[...(currentFee.extraItems || [])]
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((e: any) => {
        const remaining = extraRemainingPaise(currentFee, { id: e.id, amount: e.amount || 0 });
        return {
          kind: 'extra' as const,
          key: `${studentId}:extra:${currentFee.id}:${e.id}`,
          studentId,
          studentFeeId: currentFee.id,
          feeExtraItemId: e.id,
          label: e.name,
          duePaise: remaining,
          stickerPaise: e.amount || 0,
          monthLabel: currentLabel,
          isPaid: remaining <= 0,
          studentName,
        };
      }),
  ];

  return { currentMonthItems, previousItems, currentMonthLabel: currentLabel };
}

/** Convert checked items into per-student allocate payload for the API. */
export function buildStudentAllocatePayloads(
  items: AllocateItem[],
  checked: Set<string>,
  fundedByKey: Map<string, number>,
): { studentId: string; amountPaidPaise: number; previousMonths: { studentFeeId: string; amountPaise: number }[]; currentMonth?: { studentFeeId: string; heads: { feeHeadId?: string; headName?: string; amountPaise: number }[]; extras: { feeExtraItemId: string; amountPaise: number }[] } }[] {
  const byStudent = new Map<string, AllocateItem[]>();
  for (const item of items) {
    if (!checked.has(item.key)) continue;
    const list = byStudent.get(item.studentId) || [];
    list.push(item);
    byStudent.set(item.studentId, list);
  }

  const result: ReturnType<typeof buildStudentAllocatePayloads> = [];
  for (const [studentId, studentItems] of byStudent) {
    const previousMonths = studentItems
      .filter(i => i.kind === 'previousMonth')
      .map(i => ({ studentFeeId: i.studentFeeId, amountPaise: fundedByKey.get(i.key) || 0 }));

    const headItems = studentItems.filter(i => i.kind === 'head');
    const extraItems = studentItems.filter(i => i.kind === 'extra');
    const curFeeId = headItems[0]?.studentFeeId || extraItems[0]?.studentFeeId;

    let amountPaidPaise = previousMonths.reduce((s, p) => s + p.amountPaise, 0);
    const currentMonth = curFeeId
      ? {
          studentFeeId: curFeeId,
          heads: headItems.map(h => ({
            feeHeadId: (h as Extract<AllocateItem, { kind: 'head' }>).feeHeadId,
            headName: (h as Extract<AllocateItem, { kind: 'head' }>).headName,
            amountPaise: fundedByKey.get(h.key) || 0,
          })),
          extras: extraItems.map(e => ({
            feeExtraItemId: (e as Extract<AllocateItem, { kind: 'extra' }>).feeExtraItemId,
            amountPaise: fundedByKey.get(e.key) || 0,
          })),
        }
      : undefined;

    if (currentMonth) {
      amountPaidPaise += currentMonth.heads.reduce((s, h) => s + h.amountPaise, 0);
      amountPaidPaise += currentMonth.extras.reduce((s, e) => s + e.amountPaise, 0);
    }

    if (amountPaidPaise <= 0) continue;
    result.push({ studentId, amountPaidPaise, previousMonths, currentMonth });
  }
  return result;
}
