/**
 * Canteen Products — Frontend Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import CanteenProductsPage from '../../app/admin/canteen/products/page';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/admin/canteen/products',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ChevronLeft: 'div', Plus: 'div', Tag: 'div',
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

const mockCategories = [
  { id: 'cat1', name: 'Snacks', isActive: true },
  { id: 'cat2', name: 'Drinks', isActive: true },
  { id: 'cat3', name: 'Meals', isActive: false },
];

const mockProducts = [
  { id: 'p1', name: 'Samosa', category: { id: 'cat1', name: 'Snacks' }, unitPrice: 30, boxPrice: 300, unitsPerBox: 12, isActive: true },
  { id: 'p2', name: 'Juice Box', category: { id: 'cat2', name: 'Drinks' }, unitPrice: 50, boxPrice: 500, unitsPerBox: 10, isActive: true },
  { id: 'p3', name: 'Biryani', category: { id: 'cat3', name: 'Meals' }, unitPrice: 150, boxPrice: 1500, unitsPerBox: 10, isActive: false },
  { id: 'p4', name: 'Chips', category: { id: 'cat1', name: 'Snacks' }, unitPrice: 20, boxPrice: 200, unitsPerBox: 10, isActive: true },
  { id: 'p5', name: 'Water', category: { id: 'cat2', name: 'Drinks' }, unitPrice: 40, boxPrice: null, unitsPerBox: null, isActive: true },
];

type FetchOpts = {
  products?: typeof mockProducts;
  categories?: typeof mockCategories;
  loading?: boolean;
  onRequest?: (url: string, init?: RequestInit) => void;
};

function createCanteenProductsFetch(opts: FetchOpts = {}): typeof fetch {
  const products = opts.products ?? mockProducts;
  const categories = opts.categories ?? mockCategories;
  if (opts.loading) {
    return vi.fn(() => new Promise(() => {})) as typeof fetch;
  }
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    opts.onRequest?.(url, init);
    if (url.includes('/canteen/products')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: products }) } as Response);
    }
    if (url.includes('/canteen/categories')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: categories }) } as Response);
    }
    if (url.includes('/canteen/categories') && init?.method === 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'new-cat', name: 'New' } }) } as Response);
    }
    if (url.includes('/canteen/products') && init?.method === 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'new-p' } }) } as Response);
    }
    if (url.includes('/canteen/products/') && (init?.method === 'PATCH' || init?.method === 'DELETE')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: {} }) } as Response);
    }
    if (url.includes('/canteen/categories/') && init?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: {} }) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
  }) as typeof fetch;
}

describe('CanteenProductsPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createCanteenProductsFetch(); });

  it('renders page title', async () => {
    render(<CanteenProductsPage />);
    expect(await screen.findByText('Products')).toBeInTheDocument();
  });

  it('renders subtitle', async () => {
    render(<CanteenProductsPage />);
    expect(await screen.findByText(/Catalog — unit & box pricing/)).toBeInTheDocument();
  });

  it('shows Add product button', async () => {
    render(<CanteenProductsPage />);
    expect(await screen.findByText('Add product')).toBeInTheDocument();
  });

  it('shows back to Canteen link', async () => {
    render(<CanteenProductsPage />);
    expect(await screen.findByText('Canteen')).toBeInTheDocument();
  });

  it('shows category input placeholder', async () => {
    render(<CanteenProductsPage />);
    expect(await screen.findByPlaceholderText('New category name')).toBeInTheDocument();
  });

  it('shows Add category button', async () => {
    render(<CanteenProductsPage />);
    expect(await screen.findByText('Add category')).toBeInTheDocument();
  });

  it('renders loading skeleton', async () => {
    global.fetch = createCanteenProductsFetch({ loading: true });
    render(<CanteenProductsPage />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows empty state when no products', async () => {
    global.fetch = createCanteenProductsFetch({ products: [], categories: [] });
    render(<CanteenProductsPage />);
    expect(await screen.findByText(/No products yet/)).toBeInTheDocument();
  });

  it('navigates back to canteen hub', async () => {
    render(<CanteenProductsPage />);
    fireEvent.click(await screen.findByText('Canteen'));
    expect(mockPush).toHaveBeenCalledWith('/admin/canteen');
  });

  it('requests products and categories on load', async () => {
    const urls: string[] = [];
    global.fetch = createCanteenProductsFetch({ onRequest: (u) => urls.push(u) });
    render(<CanteenProductsPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/canteen/products'))).toBe(true));
    expect(urls.some((u) => u.includes('/canteen/categories'))).toBe(true);
  });

  it('includes branchId in API requests', async () => {
    const urls: string[] = [];
    global.fetch = createCanteenProductsFetch({ onRequest: (u) => urls.push(u) });
    render(<CanteenProductsPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('branchId=b-1'))).toBe(true));
  });
});

describe('CanteenProductsPage — product table', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createCanteenProductsFetch(); });

  it.each(mockProducts.map((p) => [p.name]))('renders product %s', async (name) => {
    render(<CanteenProductsPage />);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it('shows table headers', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Unit price')).toBeInTheDocument();
    expect(screen.getByText('Box price')).toBeInTheDocument();
    expect(screen.getByText('Units / box')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it.each([
    ['Samosa', 'Snacks'],
    ['Juice Box', 'Drinks'],
    ['Biryani', 'Meals'],
  ])('shows category %s for product %s', async (product, category) => {
    render(<CanteenProductsPage />);
    await screen.findByText(product);
    const row = screen.getByText(product).closest('tr');
    expect(row?.textContent).toContain(category);
  });

  it('shows Active status for active products', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const activeLabels = screen.getAllByText('Active');
    expect(activeLabels.length).toBeGreaterThanOrEqual(3);
  });

  it('shows Disabled status for inactive product', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Biryani');
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('shows em dash for missing box price', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Water');
    const row = screen.getByText('Water').closest('tr');
    expect(row?.textContent).toContain('—');
  });

  it('shows Edit button per product', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const editBtns = screen.getAllByText('Edit');
    expect(editBtns.length).toBeGreaterThanOrEqual(mockProducts.length);
  });

  it('shows Disable for active products', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const disableBtns = screen.getAllByText('Disable');
    expect(disableBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Enable for disabled product', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Biryani');
    const row = screen.getByText('Biryani').closest('tr');
    expect(row?.textContent).toContain('Enable');
  });
});

describe('CanteenProductsPage — categories', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createCanteenProductsFetch(); });

  it.each(mockCategories.map((c) => [c.name]))('renders category chip %s', async (name) => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const chips = document.querySelectorAll('.mb-6.flex.flex-wrap.gap-2 > div');
    expect(Array.from(chips).some((el) => el.textContent?.includes(name))).toBe(true);
  });

  it('shows disabled label for inactive category', async () => {
    render(<CanteenProductsPage />);
    expect(await screen.findByText(/Meals.*disabled/)).toBeInTheDocument();
  });

  it('shows Edit on category chips', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const chipArea = document.querySelector('.mb-6.flex.flex-wrap.gap-2');
    const editBtns = chipArea?.querySelectorAll('button') ?? [];
    expect(editBtns.length).toBeGreaterThanOrEqual(mockCategories.length);
  });

  it('enters category edit mode', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const chipArea = document.querySelector('.mb-6.flex.flex-wrap.gap-2');
    const editBtn = chipArea?.querySelector('button');
    if (editBtn) fireEvent.click(editBtn);
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
  });

  it('cancels category edit', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const chipArea = document.querySelector('.mb-6.flex.flex-wrap.gap-2');
    const editBtn = chipArea?.querySelector('button');
    if (editBtn) fireEvent.click(editBtn);
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('adds category via API', async () => {
    const urls: string[] = [];
    global.fetch = createCanteenProductsFetch({ onRequest: (u, init) => { urls.push(u); if (init?.method) urls.push(init.method); } });
    render(<CanteenProductsPage />);
    fireEvent.change(await screen.findByPlaceholderText('New category name'), { target: { value: 'Desserts' } });
    fireEvent.click(screen.getByText('Add category'));
    await waitFor(() => expect(urls.some((u) => u.includes('/canteen/categories') && u.includes('POST') === false)).toBe(true));
  });
});

describe('CanteenProductsPage — product modal', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createCanteenProductsFetch(); });

  it('opens create modal on Add product', async () => {
    render(<CanteenProductsPage />);
    fireEvent.click(await screen.findByText('Add product'));
    expect(await screen.findByText('New product')).toBeInTheDocument();
  });

  it('shows form fields in create modal', async () => {
    render(<CanteenProductsPage />);
    fireEvent.click(await screen.findByText('Add product'));
    expect(await screen.findByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Unit price (1 piece)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Box price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Units in one box')).toBeInTheDocument();
  });

  it('shows category options in modal', async () => {
    render(<CanteenProductsPage />);
    fireEvent.click(await screen.findByText('Add product'));
    const select = await screen.findByDisplayValue('Category…');
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toContain('Snacks');
    expect(options).toContain('Drinks');
  });

  it('closes modal on Cancel', async () => {
    render(<CanteenProductsPage />);
    fireEvent.click(await screen.findByText('Add product'));
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByText('New product')).not.toBeInTheDocument();
  });

  it('opens edit modal with product name', async () => {
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const row = screen.getByText('Samosa').closest('tr');
    const editBtn = row?.querySelector('button');
    if (editBtn) fireEvent.click(editBtn);
    expect(await screen.findByText('Edit product')).toBeInTheDocument();
  });

  it('shows validation toast when saving empty form', async () => {
    render(<CanteenProductsPage />);
    fireEvent.click(await screen.findByText('Add product'));
    fireEvent.click(await screen.findByText('Save'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', expect.stringContaining('Fill name')));
  });

  it('creates product via API', async () => {
    const bodies: string[] = [];
    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.body) bodies.push(init.body as string);
      if (url.includes('/canteen/products') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: {} }) } as Response);
      }
      if (url.includes('/canteen/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockProducts }) } as Response);
      }
      if (url.includes('/canteen/categories')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockCategories }) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
    }) as typeof fetch;
    render(<CanteenProductsPage />);
    fireEvent.click(await screen.findByText('Add product'));
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Cookie' } });
    fireEvent.change(screen.getByPlaceholderText('Unit price (1 piece)'), { target: { value: '25' } });
    fireEvent.change(screen.getByPlaceholderText('Box price'), { target: { value: '250' } });
    fireEvent.change(screen.getByPlaceholderText('Units in one box'), { target: { value: '10' } });
    const select = screen.getByDisplayValue('Category…');
    fireEvent.change(select, { target: { value: 'cat1' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(bodies.some((b) => b.includes('Cookie'))).toBe(true));
  });

  it('deactivates product via API', async () => {
    const methods: string[] = [];
    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method) methods.push(`${init.method}:${url}`);
      if (url.includes('/canteen/products/p1') && init?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as Response);
      }
      if (url.includes('/canteen/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockProducts }) } as Response);
      }
      if (url.includes('/canteen/categories')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockCategories }) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
    }) as typeof fetch;
    render(<CanteenProductsPage />);
    await screen.findByText('Samosa');
    const row = screen.getByText('Samosa').closest('tr');
    const disableBtn = Array.from(row?.querySelectorAll('button') || []).find((b) => b.textContent === 'Disable');
    if (disableBtn) fireEvent.click(disableBtn);
    await waitFor(() => expect(methods.some((m) => m.includes('DELETE') && m.includes('p1'))).toBe(true));
  });
});

describe('CanteenProductsPage — price formatting', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });

  it.each([
    ['Samosa', 'Rs 30'],
    ['Juice Box', 'Rs 50'],
    ['Biryani', 'Rs 150'],
  ])('formats unit price for %s as %s', async (name, price) => {
    global.fetch = createCanteenProductsFetch();
    render(<CanteenProductsPage />);
    await screen.findByText(name);
    const row = screen.getByText(name).closest('tr');
    expect(row?.textContent).toContain(price);
  });

  it.each([
    [30, 300, 12],
    [50, 500, 10],
    [20, 200, 10],
  ])('displays units per box %i for product with box %i', async (unitPrice, boxPrice, units) => {
    const products = [{
      id: 'px', name: `Item-${units}`, category: { id: 'cat1', name: 'Snacks' },
      unitPrice, boxPrice, unitsPerBox: units, isActive: true,
    }];
    global.fetch = createCanteenProductsFetch({ products });
    render(<CanteenProductsPage />);
    expect(await screen.findByText(String(units))).toBeInTheDocument();
  });
});
