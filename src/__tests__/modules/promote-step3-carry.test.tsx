import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

const mockGetPreconditions = vi.hoisted(() => vi.fn());
const mockGetCalendars = vi.hoisted(() => vi.fn());
const mockStart = vi.hoisted(() => vi.fn());
const mockUpdateCarry = vi.hoisted(() => vi.fn());
const mockSnapshot = vi.hoisted(() => vi.fn());
const mockApply = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
// Stable router identity — a fresh object per render would re-trigger the
// page's [sourceAyId, router] effect and reset form state mid-interaction.
const mockRouter = vi.hoisted(() => ({ push: mockPush, back: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: 'ay-source' }),
  usePathname: () => '/admin/academic-years/ay-source/promote',
}));

vi.mock('@/lib/api', () => ({
  api: {
    getPromotionPreconditions: mockGetPreconditions,
    getCalendars: mockGetCalendars,
    startBatchPromotion: mockStart,
    updatePromotionCarry: mockUpdateCarry,
    snapshotBatchPromotion: mockSnapshot,
    applyBatchPromotion: mockApply,
  },
}));

const localStorageMock = (() => {
  const store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'b1' };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {},
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import BatchPromotionPage from '@/app/admin/academic-years/[id]/promote/page';

const ALL_TRUE = {
  classes: true, subjects: true, students: true,
  teacherAssignments: true, timetableGrid: true, feeStructures: true,
};

function mockPreconditions() {
  mockGetPreconditions.mockResolvedValue({
    success: true,
    data: {
      source: { calendar: { label: '2025-26' } },
      buildYears: [{ id: 'ay-target', calendar: { label: '2026-27' } }],
      inProgressRun: null,
      defaultCarryOptions: { ...ALL_TRUE },
      acknowledgements: ['The current ACTIVE year stays live until you publish.'],
      fixedStudentRules: [],
    },
  });
  mockGetCalendars.mockResolvedValue({ success: true, data: [] });
}

function mockStartedRun() {
  mockStart.mockResolvedValue({
    success: true,
    data: {
      id: 'run-1', phase: 'DRAFT',
      sourceAcademicYearId: 'ay-source', targetAcademicYearId: 'ay-target',
      targetAy: { calendar: { label: '2026-27' } },
      carryOptions: { ...ALL_TRUE },
    },
  });
}

/** Drive the wizard from step 1 through Start promotion → lands on step 3. */
async function reachStep3(user: ReturnType<typeof userEvent.setup>) {
  render(<BatchPromotionPage />);
  await screen.findByText('Step 1 — Confirm');

  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: /Continue/i }));
  await screen.findByText('Step 2 — Target year & carry options');

  await user.selectOptions(
    screen.getByDisplayValue('Select target BUILD_STAGE year…'),
    'ay-target',
  );
  await user.click(screen.getByRole('button', { name: /Start promotion/i }));
  await screen.findByText('Step 3 — Build stage');
}

describe('BatchPromotionPage — step 3 carry options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreconditions();
    mockStartedRun();
    mockUpdateCarry.mockResolvedValue({
      success: true,
      data: { id: 'run-1', phase: 'DRAFT', carryOptions: { ...ALL_TRUE, students: false } },
    });
    mockSnapshot.mockResolvedValue({
      success: true,
      data: { id: 'run-1', phase: 'SNAPSHOT_DONE', carryOptions: { ...ALL_TRUE, students: false } },
    });
  });

  it('shows the keep-in-new-year checkboxes on step 3', async () => {
    const user = userEvent.setup();
    await reachStep3(user);

    expect(screen.getByText('Keep in the new year')).toBeInTheDocument();
    expect(screen.getByLabelText(/Promote active students/)).toBeChecked();
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
  });

  it('saves checkbox edits via the carry endpoint before snapshot', async () => {
    const user = userEvent.setup();
    await reachStep3(user);

    await user.click(screen.getByLabelText(/Promote active students/));
    expect(screen.getByRole('button', { name: 'Save carry options' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Save carry options' }));
    expect(mockUpdateCarry).toHaveBeenCalledWith(
      'b1', 'ay-source', 'run-1',
      expect.objectContaining({ students: false, classes: true }),
    );
  });

  it('snapshot auto-saves a dirty draft first, then snapshots', async () => {
    const user = userEvent.setup();
    await reachStep3(user);

    await user.click(screen.getByLabelText(/Promote active students/));
    await user.click(screen.getByRole('button', { name: /Create snapshot/i }));

    expect(mockUpdateCarry).toHaveBeenCalledTimes(1);
    expect(mockSnapshot).toHaveBeenCalledWith('b1', 'ay-source', 'run-1');
    expect(await screen.findByText(/SNAPSHOT_DONE/)).toBeInTheDocument();
  });
});
