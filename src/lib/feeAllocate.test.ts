import { describe, expect, test } from 'vitest';
import { mergeFeeHeadBreakdown, buildAllocateItemsForStudent } from './feeAllocate';

describe('mergeFeeHeadBreakdown', () => {
  test('merges duplicate feeHeadId rows', () => {
    const merged = mergeFeeHeadBreakdown([
      { feeHeadId: 'fh-paper', name: 'PaperFund', amount: 50000 },
      { feeHeadId: 'fh-paper', name: 'PaperFund', amount: 50000 },
      { feeHeadId: 'fh-monthly', name: 'MonthlyFee', amount: 500000 },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.find((h) => h.feeHeadId === 'fh-paper')?.amount).toBe(100000);
  });
});

describe('buildAllocateItemsForStudent', () => {
  test('uses one row per fee head for allocation UI keys', () => {
    const { currentMonthItems } = buildAllocateItemsForStudent('s1', 'Ali', [{
      id: 'sf1', month: 7, year: 2026, netAmount: 600000, paidAmount: 0,
      feeHeadBreakdown: [
        { feeHeadId: 'fh-paper', name: 'PaperFund', amount: 50000 },
        { feeHeadId: 'fh-paper', name: 'PaperFund', amount: 50000 },
        { feeHeadId: 'fh-monthly', name: 'MonthlyFee', amount: 500000 },
      ],
      extraItems: [],
      headAllocations: [],
    }]);
    const paper = currentMonthItems.filter((i) => i.kind === 'head' && i.headName === 'PaperFund');
    expect(paper).toHaveLength(1);
    expect(paper[0].duePaise).toBe(100000);
    const keys = currentMonthItems.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
