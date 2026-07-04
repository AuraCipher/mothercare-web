export type FeeStatusFilter = '' | 'unpaid' | 'partial' | 'paid';

export const FEE_STATUS_OPTIONS: { value: FeeStatusFilter; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

export function matchesFeeStatusFilter(status: string, filter: FeeStatusFilter): boolean {
  if (!filter) return true;
  if (filter === 'paid') return status === 'PAID' || status === 'OVERPAID';
  if (filter === 'partial') return status === 'PARTIAL';
  if (filter === 'unpaid') return status === 'UNPAID';
  return true;
}

/** Aggregate payment status from fee rows (full AY or family context). */
export function computeStudentStatusFromFees(
  fees: { netAmount: number; paidAmount: number; extraItems?: { amount: number }[] | null; totalDuePaise?: number }[],
): string {
  if (!fees || fees.length === 0) return 'NO_FEE';
  let totalDue = 0;
  let paid = 0;
  for (const f of fees) {
    const extra = (f.extraItems || []).reduce((s, e) => s + e.amount, 0);
    totalDue += f.totalDuePaise ?? (f.netAmount + extra);
    paid += f.paidAmount || 0;
  }
  if (totalDue === 0) return 'NO_FEE';
  if (paid >= totalDue) return paid > totalDue ? 'OVERPAID' : 'PAID';
  return paid > 0 ? 'PARTIAL' : 'UNPAID';
}

/** Status from collection row or family student summary fields. */
export function computeStudentStatusFromTotals(netAmount: number, paidAmount: number): string {
  if (netAmount === 0 && paidAmount === 0) return 'NO_FEE';
  if (paidAmount >= netAmount) return paidAmount > netAmount ? 'OVERPAID' : 'PAID';
  return paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
}

/** Family student with totalDuePaise + optional fee rows. */
export function familyStudentPaymentStatus(student: {
  totalDuePaise?: number;
  studentFees?: { netAmount: number; paidAmount: number; extraItems?: { amount: number }[] | null; totalDuePaise?: number; remainingPaise?: number }[];
}): string {
  const fees = student.studentFees || [];
  if (fees.length > 0) return computeStudentStatusFromFees(fees);
  const remaining = student.totalDuePaise ?? 0;
  if (remaining <= 0) return 'PAID';
  return 'UNPAID';
}
