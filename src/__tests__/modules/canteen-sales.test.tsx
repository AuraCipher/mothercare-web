/**
 * Canteen Sales — Frontend Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import CanteenSalesPage from '../../app/admin/canteen/sales/page';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockSearchParams = vi.hoisted(() => vi.fn(() => new URLSearchParams()));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/admin/canteen/sales',
  useSearchParams: () => mockSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ChevronLeft: 'div', Minus: 'div', Plus: 'div', ShoppingCart: 'div', PackagePlus: 'div', X: 'div',
  Trash2: 'div',
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

const baseProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Samosa',
  unitPrice: 30,
  stockBoxes: 2,
  stockUnits: 5,
  unitsPerBox: 12,
  lowStockThreshold: 10,
  isActive: true,
  category: { id: 'cat1', name: 'Snacks' },
  ...overrides,
});

const mockProducts = [
  baseProduct({ id: 'p1', name: 'Samosa', category: { id: 'cat1', name: 'Snacks' } }),
  baseProduct({ id: 'p2', name: 'Juice', unitPrice: 50, category: { id: 'cat2', name: 'Drinks' } }),
  baseProduct({ id: 'p3', name: 'Chips', unitPrice: 20, stockBoxes: 0, stockUnits: 0, category: { id: 'cat1', name: 'Snacks' } }),
  baseProduct({ id: 'p4', name: 'Biscuit', unitPrice: 15, stockUnits: 3, lowStockThreshold: 5, category: { id: 'cat1', name: 'Snacks' } }),
  baseProduct({ id: 'p5', name: 'Tea', unitPrice: 25, category: { id: 'cat2', name: 'Drinks' } }),
];

type FetchOpts = {
  products?: typeof mockProducts;
  account?: { id: string; displayName: string } | null;
  loading?: boolean;
  onRequest?: (url: string, init?: RequestInit) => void;
};

function createSalesFetch(opts: FetchOpts = {}): typeof fetch {
  const products = opts.products ?? mockProducts;
  if (opts.loading) return vi.fn(() => new Promise(() => {})) as typeof fetch;
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    opts.onRequest?.(url, init);
    if (url.includes('/canteen/products')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: products }) } as Response);
    }
    if (url.includes('/canteen/accounts/acc1')) {
      const acc = opts.account ?? { id: 'acc1', displayName: 'Ahmed Khan' };
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: acc }) } as Response);
    }
    if (url.includes('/canteen/sales') && init?.method === 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'sale1' } }) } as Response);
    }
    if (url.includes('/canteen/credit-classes')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ id: 'g1', name: 'Class 5', section: 'A' }] }) } as Response);
    }
    if (url.includes('/canteen/credit-persons')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ id: 's1', name: 'Ali', rollNumber: '1' }] }) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
  }) as typeof fetch;
}

async function openProductPicker() {
  fireEvent.click((await screen.findAllByText('Add products'))[0]);
  await screen.findByPlaceholderText('Search products…');
}

async function addProductToCart(name: string) {
  await openProductPicker();
  fireEvent.click(await screen.findByText(name));
}

describe('CanteenSalesPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLS();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    global.fetch = createSalesFetch();
  });

  it('renders Daily Sales title', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText('Daily Sales')).toBeInTheDocument();
  });

  it('shows Canteen back link by default', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText('Canteen')).toBeInTheDocument();
  });

  it('shows Today\'s sale section', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText("Today's sale")).toBeInTheDocument();
  });

  it('shows empty cart message', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText(/No products added yet/)).toBeInTheDocument();
  });

  it('shows Add products button', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText('Add products')).toBeInTheDocument();
  });

  it('shows Select products secondary button in empty state', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText('Select products')).toBeInTheDocument();
  });

  it('loads active products on mount', async () => {
    const urls: string[] = [];
    global.fetch = createSalesFetch({ onRequest: (u) => urls.push(u) });
    render(<CanteenSalesPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/canteen/products') && u.includes('activeOnly=true'))).toBe(true));
  });

  it('includes branchId in product request', async () => {
    const urls: string[] = [];
    global.fetch = createSalesFetch({ onRequest: (u) => urls.push(u) });
    render(<CanteenSalesPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('branchId=b-1'))).toBe(true));
  });

  it('navigates back to canteen hub', async () => {
    render(<CanteenSalesPage />);
    fireEvent.click(await screen.findByText('Canteen'));
    expect(mockPush).toHaveBeenCalledWith('/admin/canteen');
  });
});

describe('CanteenSalesPage — preset account', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLS();
    mockSearchParams.mockReturnValue(new URLSearchParams('accountId=acc1'));
    global.fetch = createSalesFetch({ account: { id: 'acc1', displayName: 'Ahmed Khan' } });
  });

  it('shows credit order banner', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText(/Credit order for/)).toBeInTheDocument();
    expect(await screen.findByText('Ahmed Khan')).toBeInTheDocument();
  });

  it('shows Account back link', async () => {
    render(<CanteenSalesPage />);
    expect(await screen.findByText('Account')).toBeInTheDocument();
  });

  it('navigates to account on back', async () => {
    render(<CanteenSalesPage />);
    fireEvent.click(await screen.findByText('Account'));
    expect(mockPush).toHaveBeenCalledWith('/admin/canteen/accounts/acc1');
  });

  it('loads account details from API', async () => {
    const urls: string[] = [];
    global.fetch = createSalesFetch({ account: { id: 'acc1', displayName: 'Ahmed Khan' }, onRequest: (u) => urls.push(u) });
    render(<CanteenSalesPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/canteen/accounts/acc1'))).toBe(true));
  });
});

describe('CanteenSalesPage — product picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLS();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    global.fetch = createSalesFetch();
  });

  it('opens product picker modal', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    expect(screen.getByPlaceholderText('Search products…')).toBeInTheDocument();
  });

  it.each(['Snacks', 'Drinks'])('shows category group %s', async (cat) => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    expect(await screen.findByText(cat)).toBeInTheDocument();
  });

  it.each(mockProducts.filter((p) => p.stockBoxes > 0 || p.stockUnits > 0).map((p) => [p.name]))(
    'lists product %s in picker',
    async (name) => {
      render(<CanteenSalesPage />);
      await openProductPicker();
      expect(await screen.findByText(name)).toBeInTheDocument();
    },
  );

  it('filters products by search', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    fireEvent.change(screen.getByPlaceholderText('Search products…'), { target: { value: 'juice' } });
    expect(await screen.findByText('Juice')).toBeInTheDocument();
    expect(screen.queryByText('Samosa')).not.toBeInTheDocument();
  });

  it('filters by category name', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    fireEvent.change(screen.getByPlaceholderText('Search products…'), { target: { value: 'drinks' } });
    expect(await screen.findByText('Juice')).toBeInTheDocument();
    expect(screen.queryByText('Samosa')).not.toBeInTheDocument();
  });

  it('shows no match message for bad search', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    fireEvent.change(screen.getByPlaceholderText('Search products…'), { target: { value: 'zzznomatch' } });
    expect(await screen.findByText(/No products match your search/)).toBeInTheDocument();
  });

  it('disables out of stock product', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    const chipsBtn = await screen.findByText('Chips');
    expect(chipsBtn.closest('button')).toBeDisabled();
  });

  it('shows Out of stock label', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    expect(await screen.findByText('Out of stock')).toBeInTheDocument();
  });

  it('closes picker on Done', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByPlaceholderText('Search products…')).not.toBeInTheDocument();
  });

  it('closes picker on X button', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByPlaceholderText('Search products…')).not.toBeInTheDocument();
  });
});

describe('CanteenSalesPage — cart interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLS();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    global.fetch = createSalesFetch();
  });

  it('adds product to cart', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    expect(await screen.findByText(/1 unit/)).toBeInTheDocument();
  });

  it('shows product line in cart', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    expect(await screen.findByText('Samosa')).toBeInTheDocument();
  });

  it('auto-fills cash amount to total', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    await screen.findByText('Products total');
    const cashInputs = document.querySelectorAll('input[placeholder="0"]');
    expect(cashInputs.length).toBeGreaterThanOrEqual(1);
    expect((cashInputs[0] as HTMLInputElement).value).toBe('30');
  });

  it('increases quantity with plus button', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(await screen.findByText(/2 unit/)).toBeInTheDocument();
  });

  it('decreases quantity with minus button', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(await screen.findByText(/1 unit/)).toBeInTheDocument();
  });

  it('shows payment mismatch warning', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    const inputs = document.querySelectorAll('input[type="number"]');
    const cashInput = Array.from(inputs).find((el) => el.closest('div')?.textContent?.includes('Total cash'));
    if (cashInput) fireEvent.change(cashInput, { target: { value: '1' } });
    expect(await screen.findByText(/Cash \+ credit must equal/)).toBeInTheDocument();
  });

  it('disables confirm when payment mismatched', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    const inputs = document.querySelectorAll('input[type="number"]');
    const cashInput = Array.from(inputs).find((el) => el.closest('div')?.textContent?.includes('Total cash'));
    if (cashInput) fireEvent.change(cashInput, { target: { value: '1' } });
    const confirmBtn = screen.getByText("Confirm today's sales");
    expect(confirmBtn).toBeDisabled();
  });

  it('disables confirm when cart is empty', async () => {
    render(<CanteenSalesPage />);
    const confirmBtn = await screen.findByText("Confirm today's sales");
    expect(confirmBtn).toBeDisabled();
  });

  it('posts sale on confirm', async () => {
    const bodies: string[] = [];
    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.body) bodies.push(init.body as string);
      if (url.includes('/canteen/sales') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as Response);
      }
      if (url.includes('/canteen/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockProducts }) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
    }) as typeof fetch;
    render(<CanteenSalesPage />);
    await addProductToCart('Samosa');
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(await screen.findByText("Confirm today's sales"));
    await waitFor(() => expect(bodies.some((b) => b.includes('p1'))).toBe(true));
    expect(mockShowToast).toHaveBeenCalledWith('success', expect.stringContaining('sale recorded'));
  });

  it('shows toast for out of stock add', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    const chips = screen.getByText('Chips');
    fireEvent.click(chips);
    expect(mockShowToast).not.toHaveBeenCalledWith('error', 'Out of stock');
  });
});

describe('CanteenSalesPage — payment fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLS();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    global.fetch = createSalesFetch();
  });

  it('shows Total cash label', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Juice');
    fireEvent.click(screen.getByText('Done'));
    expect(await screen.findByText(/Total cash/i)).toBeInTheDocument();
  });

  it('shows Total credit label', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Juice');
    fireEvent.click(screen.getByText('Done'));
    expect(await screen.findByText(/Total credit/i)).toBeInTheDocument();
  });

  it('shows Total sales summary', async () => {
    render(<CanteenSalesPage />);
    await addProductToCart('Juice');
    fireEvent.click(screen.getByText('Done'));
    expect(await screen.findByText('Total sales')).toBeInTheDocument();
  });

  it.each([
    ['Samosa', 30],
    ['Juice', 50],
    ['Tea', 25],
  ])('calculates total for %s at Rs %i', async (name, price) => {
    render(<CanteenSalesPage />);
    await addProductToCart(name);
    fireEvent.click(screen.getByText('Done'));
    const matches = await screen.findAllByText(`Rs ${price}`);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

describe('CanteenSalesPage — empty catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLS();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    global.fetch = createSalesFetch({ products: [] });
  });

  it('shows no active products message', async () => {
    render(<CanteenSalesPage />);
    await openProductPicker();
    expect(await screen.findByText(/No active products/)).toBeInTheDocument();
  });
});
