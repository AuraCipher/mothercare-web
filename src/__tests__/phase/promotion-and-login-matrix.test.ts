import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: 'ay-1' }),
}));
vi.mock('@/components/toast', () => ({ showToast: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: {} }));
vi.mock('lucide-react', () => ({
  ArrowLeft: 'div',
  Check: 'div',
  ChevronRight: 'div',
  Plus: 'div',
  X: 'div',
}));

type Carry = Record<string, boolean>;
const carryKeys = [
  'classes',
  'students',
  'subjects',
  'teacherAssignments',
  'timetableGrid',
  'feeStructures',
  'attendance',
];

function expectedInvalid(c: Carry) {
  return (!!c.students && !c.classes)
    || (!!c.teacherAssignments && (!c.classes || !c.subjects))
    || (!!c.timetableGrid && (!c.classes || !c.subjects));
}

function expectedSelected(c: Carry) {
  return carryKeys.filter((k) => !!c[k]).length;
}

describe('Promotion carry validation matrix', () => {
  it('includes all 128 carry permutations', () => {
    expect(2 ** carryKeys.length).toBe(128);
  });

  for (let mask = 0; mask < 2 ** carryKeys.length; mask += 1) {
    const c: Carry = {};
    carryKeys.forEach((k, i) => { c[k] = !!(mask & (1 << i)); });

    it(`carry permutation ${mask + 1}/128`, async () => {
      const mod = await import('@/app/admin/academic-years/[id]/promote/page');
      const result = mod.getPromotionCarryValidation(c);
      expect(result.invalidCarryConfig).toBe(expectedInvalid(c));
      expect(result.selectedCarryCount).toBe(expectedSelected(c));
    });
  }
});

describe('Login error message mapping matrix', () => {
  const graduationVariants = [
    'Student login is disabled after graduation',
    'login disabled after graduation',
    'disabled after graduation',
    '403: Student login is disabled after graduation',
    'Your access disabled after graduation',
    'Disabled after graduation by school',
    'student disabled after graduation reason',
    'graduation completed; disabled after graduation',
    'error disabled after graduation now',
    'account disabled after graduation state',
  ];

  const enrollmentVariants = [
    'Student is not enrolled in any active academic year',
    'not enrolled in any active academic year',
    '403: not enrolled in any active academic year',
    'student not enrolled in any active academic year now',
    'cannot login not enrolled in any active academic year',
    'warning not enrolled in any active academic year',
    'state not enrolled in any active academic year',
    'auth not enrolled in any active academic year',
    'error not enrolled in any active academic year',
    'blocked not enrolled in any active academic year',
  ];

  const passthroughVariants = [
    'Invalid credentials',
    'Account is not active',
    'Cannot reach the server. Please try again.',
    'Too many attempts',
    'Password mismatch',
    'Unauthorized',
    'Unknown error',
    'JWT expired',
    '403 forbidden',
    'random message',
  ];

  for (const msg of graduationVariants) {
    it(`maps graduation message: ${msg.slice(0, 24)}`, async () => {
      const mod = await import('@/app/login/page');
      expect(mod.mapLoginErrorMessage(msg)).toContain('closed after graduation');
    });
  }

  for (const msg of enrollmentVariants) {
    it(`maps enrollment message: ${msg.slice(0, 24)}`, async () => {
      const mod = await import('@/app/login/page');
      expect(mod.mapLoginErrorMessage(msg)).toContain('No active academic-year enrollment');
    });
  }

  for (const msg of passthroughVariants) {
    it(`passes through generic message: ${msg.slice(0, 24)}`, async () => {
      const mod = await import('@/app/login/page');
      expect(mod.mapLoginErrorMessage(msg)).toBe(msg);
    });
  }
});
