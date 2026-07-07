import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';

const mockPush = vi.hoisted(() => vi.fn());
const mockAssignStationary = vi.hoisted(() => vi.fn());
const mockGetCatalog = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: 's-1' }),
  usePathname: () => '/admin/fees/student/s-1',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getFeeStationaryCatalog: mockGetCatalog,
    assignStationaryToStudentFee: mockAssignStationary,
    getFeeCarryForwardSources: vi.fn().mockResolvedValue({ success: true, data: [] }),
    carryForwardFee: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('@/components/toast', () => ({ showToast: vi.fn() }));

describe('Stationary fee integration UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCatalog.mockResolvedValue({
      success: true,
      data: [{
        categoryId: 'c1',
        categoryName: 'Stationary',
        products: [{ id: 'p1', name: 'Notebook', unitPricePaise: 2000 }],
      }],
    });
    mockAssignStationary.mockResolvedValue({ success: true });
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (k: string) => ({ token: 'jwt', activeAYId: 'ay-1', activeAYStatus: 'ACTIVE' } as any)[k] || null,
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      configurable: true,
    });
  });

  it('student page opens Add Item and submits stationary selection', async () => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/admin/students/s-1/fee')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              id: 's-1',
              name: 'Ali',
              group: { name: 'Class 1' },
              parents: [],
              studentFees: [{ id: 'sf-1', month: 6, year: 2026, netAmount: 10000, paidAmount: 0, status: 'UNPAID', payments: [], extraItems: [] }],
            },
          }),
        } as Response);
      }
      if (url.includes('/extra-items')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true }) } as Response);
      }
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) } as Response);
    }) as typeof fetch;

    const { default: Page } = await import('@/app/admin/fees/student/[id]/page');
    render(<Page />);
    fireEvent.click(await screen.findByText('Add Item'));
    fireEvent.change(screen.getByDisplayValue('Extra Due'), { target: { value: 'STATIONARY' } });
    await screen.findByText(/Notebook/);
    const qtyInput = screen.getByDisplayValue('0');
    fireEvent.change(qtyInput, { target: { value: '2' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(mockAssignStationary).toHaveBeenCalled());
  });

  it('family page opens Add Item and submits stationary with family context', async () => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/admin/families/')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              id: 'fam-1',
              name: 'Family 1',
              studentCount: 1,
              totalDuePaise: 10000,
              students: [{
                id: 's-1',
                name: 'Ali',
                feeStatus: 'UNPAID',
                totalDuePaise: 10000,
                studentFees: [{ id: 'sf-1', month: 6, year: 2026, remainingPaise: 10000 }],
              }],
              payments: [],
            },
          }),
        } as Response);
      }
      if (url.includes('/extra-items')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true }) } as Response);
      }
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) } as Response);
    }) as typeof fetch;

    const { default: FamilyPage } = await import('@/app/admin/fees/families/[id]/page');
    render(<FamilyPage />);
    fireEvent.click(await screen.findByText('Add Item'));
    fireEvent.change(screen.getByDisplayValue('Extra Due'), { target: { value: 'STATIONARY' } });
    const qtyInput = await screen.findByDisplayValue('0');
    fireEvent.change(qtyInput, { target: { value: '1' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockAssignStationary).toHaveBeenCalledWith(expect.objectContaining({
        familyId: 's-1',
      }));
    });
  });
});
