/**
 * Canteen Suppliers — Frontend Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import CanteenSuppliersPage from '../../app/admin/canteen/suppliers/page';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/admin/canteen/suppliers',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ChevronLeft: 'div', Plus: 'div', Truck: 'div',
}));

let lsStore: Record<string, string> = {};
function setupLS(extra: Record<string, string> = {}) {
  lsStore = { token: 'test-jwt', activeBranchId: 'b-1', ...extra };
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => lsStore[k] || null,
      setItem: (k: string, v: string) => { lsStore[k] = v; },
      removeItem: (k: string) => { delete lsStore[k]; },
      clear: () => { lsStore = {}; },
    },
    configurable: true,
  });
}

const mockSuppliers = [
  { id: 'sup1', name: 'Fresh Foods Ltd', contactNumber: '0300-1111111', balanceOwedToSupplier: 5000, balanceSupplierOwesUs: 0 },
  { id: 'sup2', name: 'Beverage Co', contactNumber: '0300-2222222', balanceOwedToSupplier: 0, balanceSupplierOwesUs: 1200 },
  { id: 'sup3', name: 'Local Market', contactNumber: null, balanceOwedToSupplier: 0, balanceSupplierOwesUs: 0 },
  { id: 'sup4', name: 'Dairy Direct', contactNumber: '042-3333333', balanceOwedToSupplier: 15000, balanceSupplierOwesUs: 500 },
  { id: 'sup5', name: 'Snack Wholesale', contactNumber: '0311-4444444', balanceOwedToSupplier: 250, balanceSupplierOwesUs: 0 },
];

type FetchOpts = {
  suppliers?: typeof mockSuppliers;
  loading?: boolean;
  onRequest?: (url: string, init?: RequestInit) => void;
};

function createSuppliersFetch(opts: FetchOpts = {}): typeof fetch {
  const suppliers = opts.suppliers ?? mockSuppliers;
  if (opts.loading) return vi.fn(() => new Promise(() => {})) as typeof fetch;
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    opts.onRequest?.(url, init);
    if (url.includes('/canteen/suppliers') && init?.method === 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'new-sup' } }) } as Response);
    }
    if (url.includes('/canteen/suppliers')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: suppliers }) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
  }) as typeof fetch;
}

describe('CanteenSuppliersPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createSuppliersFetch(); });

  it('renders Suppliers title', async () => {
    render(<CanteenSuppliersPage />);
    expect(await screen.findByText('Suppliers')).toBeInTheDocument();
  });

  it('renders subtitle', async () => {
    render(<CanteenSuppliersPage />);
    expect(await screen.findByText(/orders, payments & balance/)).toBeInTheDocument();
  });

  it('shows Add supplier button', async () => {
    render(<CanteenSuppliersPage />);
    expect(await screen.findByText('Add supplier')).toBeInTheDocument();
  });

  it('shows Canteen back link', async () => {
    render(<CanteenSuppliersPage />);
    expect(await screen.findByText('Canteen')).toBeInTheDocument();
  });

  it('shows loading skeleton', async () => {
    global.fetch = createSuppliersFetch({ loading: true });
    render(<CanteenSuppliersPage />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows empty state', async () => {
    global.fetch = createSuppliersFetch({ suppliers: [] });
    render(<CanteenSuppliersPage />);
    expect(await screen.findByText('No suppliers yet.')).toBeInTheDocument();
  });

  it('navigates back to canteen', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Canteen'));
    expect(mockPush).toHaveBeenCalledWith('/admin/canteen');
  });

  it('loads suppliers on mount', async () => {
    const urls: string[] = [];
    global.fetch = createSuppliersFetch({ onRequest: (u) => urls.push(u) });
    render(<CanteenSuppliersPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/canteen/suppliers'))).toBe(true));
  });

  it('includes branchId in request', async () => {
    const urls: string[] = [];
    global.fetch = createSuppliersFetch({ onRequest: (u) => urls.push(u) });
    render(<CanteenSuppliersPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('branchId=b-1'))).toBe(true));
  });
});

describe('CanteenSuppliersPage — supplier table', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createSuppliersFetch(); });

  it('shows table headers', async () => {
    render(<CanteenSuppliersPage />);
    await screen.findByText('Fresh Foods Ltd');
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('We owe')).toBeInTheDocument();
    expect(screen.getByText('They owe us')).toBeInTheDocument();
  });

  it.each(mockSuppliers.map((s) => [s.name]))('renders supplier %s', async (name) => {
    render(<CanteenSuppliersPage />);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it.each([
    ['Fresh Foods Ltd', '0300-1111111'],
    ['Beverage Co', '0300-2222222'],
    ['Dairy Direct', '042-3333333'],
  ])('shows contact %s for %s', async (name, contact) => {
    render(<CanteenSuppliersPage />);
    await screen.findByText(name);
    const row = screen.getByText(name).closest('tr');
    expect(row?.textContent).toContain(contact);
  });

  it('shows em dash for missing contact', async () => {
    render(<CanteenSuppliersPage />);
    await screen.findByText('Local Market');
    const row = screen.getByText('Local Market').closest('tr');
    expect(row?.textContent).toContain('—');
  });

  it.each([
    ['Fresh Foods Ltd', 'Rs 5,000'],
    ['Beverage Co', 'Rs 0'],
    ['Dairy Direct', 'Rs 15,000'],
  ])('formats we owe balance for %s as %s', async (name, balance) => {
    render(<CanteenSuppliersPage />);
    await screen.findByText(name);
    const row = screen.getByText(name).closest('tr');
    expect(row?.textContent).toContain(balance);
  });

  it.each([
    ['Beverage Co', 'Rs 1,200'],
    ['Dairy Direct', 'Rs 500'],
    ['Local Market', 'Rs 0'],
  ])('formats they owe us for %s as %s', async (name, balance) => {
    render(<CanteenSuppliersPage />);
    await screen.findByText(name);
    const row = screen.getByText(name).closest('tr');
    expect(row?.textContent).toContain(balance);
  });

  it('shows View details per row', async () => {
    render(<CanteenSuppliersPage />);
    await screen.findByText('Fresh Foods Ltd');
    const btns = screen.getAllByText('View details');
    expect(btns.length).toBe(mockSuppliers.length);
  });

  it.each(mockSuppliers.map((s) => [s.id, s.name]))(
    'navigates to supplier detail %s',
    async (id, name) => {
      render(<CanteenSuppliersPage />);
      await screen.findByText(name);
      const row = screen.getByText(name).closest('tr');
      const viewBtn = row?.querySelector('button');
      if (viewBtn) fireEvent.click(viewBtn);
      expect(mockPush).toHaveBeenCalledWith(`/admin/canteen/suppliers/${id}`);
    },
  );
});

describe('CanteenSuppliersPage — add supplier modal', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createSuppliersFetch(); });

  it('opens modal on Add supplier', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    expect(await screen.findByText('New supplier')).toBeInTheDocument();
  });

  it('shows name input', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    expect(await screen.findByPlaceholderText('Supplier name')).toBeInTheDocument();
  });

  it('shows contact input', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    expect(await screen.findByPlaceholderText(/Contact info/)).toBeInTheDocument();
  });

  it('shows note textarea', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    expect(await screen.findByPlaceholderText('Note')).toBeInTheDocument();
  });

  it('closes modal on Cancel', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByText('New supplier')).not.toBeInTheDocument();
  });

  it('validates empty name', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    fireEvent.click(await screen.findByText('Save'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Supplier name is required'));
  });

  it('creates supplier via API', async () => {
    const bodies: string[] = [];
    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.body) bodies.push(init.body as string);
      if (url.includes('/canteen/suppliers') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'new' } }) } as Response);
      }
      if (url.includes('/canteen/suppliers')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockSuppliers }) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
    }) as typeof fetch;
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    fireEvent.change(screen.getByPlaceholderText('Supplier name'), { target: { value: 'New Vendor' } });
    fireEvent.change(screen.getByPlaceholderText(/Contact info/), { target: { value: '0300-9999999' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(bodies.some((b) => b.includes('New Vendor'))).toBe(true));
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Supplier added');
  });

  it('clears form after successful save', async () => {
    render(<CanteenSuppliersPage />);
    fireEvent.click(await screen.findByText('Add supplier'));
    fireEvent.change(screen.getByPlaceholderText('Supplier name'), { target: { value: 'Temp Vendor' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.queryByText('New supplier')).not.toBeInTheDocument());
  });
});

describe('CanteenSuppliersPage — balance highlighting', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });

  it.each([
    { id: 'sup1', owed: 5000, owes: 0 },
    { id: 'sup2', owed: 0, owes: 1200 },
    { id: 'sup4', owed: 15000, owes: 500 },
  ])('renders supplier $id with balances owed=$owed owes=$owes', async ({ id, owed, owes }) => {
    const supplier = mockSuppliers.find((s) => s.id === id)!;
    global.fetch = createSuppliersFetch({ suppliers: [supplier] });
    render(<CanteenSuppliersPage />);
    expect(await screen.findByText(supplier.name)).toBeInTheDocument();
    if (owed > 0) expect(screen.getByText(`Rs ${owed.toLocaleString('en-PK')}`)).toBeInTheDocument();
    if (owes > 0) expect(screen.getByText(`Rs ${owes.toLocaleString('en-PK')}`)).toBeInTheDocument();
  });
});
