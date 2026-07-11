/** Carry toggles shown in the admin batch promotion wizard (mirrors backend constants). */
export const PROMOTION_UI_CARRY_KEYS = [
  'classes',
  'subjects',
  'students',
  'teacherAssignments',
  'timetableGrid',
  'feeStructures',
] as const;

export type PromotionUiCarryKey = (typeof PROMOTION_UI_CARRY_KEYS)[number];
