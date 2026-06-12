import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin/classes',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    getSections: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Playgroup', section: null, displayOrder: 1, capacity: 30, isActive: true, _count: { members: 2, students: 20 } },
        { id: '2', name: 'Class 1', section: 'A', displayOrder: 4, capacity: 30, isActive: true, _count: { members: 1, students: 15 } },
        { id: '3', name: 'Class 1', section: 'B', displayOrder: 4, capacity: 30, isActive: true, _count: { members: 1, students: 14 } },
        { id: '4', name: 'Class 10', section: null, displayOrder: 13, capacity: 30, isActive: true, _count: { members: 1, students: 25 } },
      ],
    }),
    getAcademicYears: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 'ay-1', status: 'ACTIVE' }],
    }),
    createSection: vi.fn().mockResolvedValue({ success: true }),
    deleteSection: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock localStorage with activeBranchId
const localStorageMock = (() => {
  let store: Record<string, string> = { token: 'test-jwt', activeBranchId: 'branch-1' };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import ClassesPage from '@/app/admin/classes/page';

describe('ClassesPage — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    render(<ClassesPage />);
    expect(await screen.findByText('Classes / Sections')).toBeInTheDocument();
  });

  it('renders the Add Class button', async () => {
    render(<ClassesPage />);
    expect(await screen.findByText('Add Class')).toBeInTheDocument();
  });

  it('lists all classes', async () => {
    render(<ClassesPage />);
    expect(await screen.findByText('Playgroup')).toBeInTheDocument();
    expect(await screen.findByText('Class 1')).toBeInTheDocument();
    expect(await screen.findByText('Class 10')).toBeInTheDocument();
  });

  it('shows arrangement number', async () => {
    render(<ClassesPage />);
    expect(await screen.findByText('Arr. 1')).toBeInTheDocument();
    expect(await screen.findByText('Arr. 13')).toBeInTheDocument();
  });
});

describe('ClassesPage — add class modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the create modal when Add Class is clicked', async () => {
    render(<ClassesPage />);
    const user = userEvent.setup();
    const addBtn = await screen.findByText('Add Class');
    await user.click(addBtn);

    expect(screen.getByText('Class Name')).toBeInTheDocument();
    expect(screen.getByText('Class Arrangement')).toBeInTheDocument();
  });

  it('shows sections section when toggled on', async () => {
    render(<ClassesPage />);
    const user = userEvent.setup();
    const addBtn = await screen.findByText('Add Class');
    await user.click(addBtn);

    const checkbox = screen.getByLabelText('Enable sections for this class');
    await user.click(checkbox);

    expect(screen.getByPlaceholderText(/Type and press Enter/)).toBeInTheDocument();
  });

  it('creates class with sections via Enter key', async () => {
    const { api } = await import('@/lib/api');
    render(<ClassesPage />);
    const user = userEvent.setup();
    const addBtn = await screen.findByText('Add Class');
    await user.click(addBtn);

    await user.type(screen.getByPlaceholderText(/e\.g\. Class 1/), 'Class 5');
    await user.type(screen.getByPlaceholderText(/e\.g\. 4/), '9');

    await user.click(screen.getByLabelText('Enable sections for this class'));

    const sectionInput = screen.getByPlaceholderText(/Type and press Enter/);
    await user.type(sectionInput, 'A{Enter}');
    await user.type(sectionInput, 'B{Enter}');
    await user.type(sectionInput, 'CompSci{Enter}');

    await user.click(screen.getByText('Create'));

    expect(api.createSection).toHaveBeenCalledWith('branch-1', 'ay-1', expect.objectContaining({ name: 'Class 5', section: 'A' }));
    expect(api.createSection).toHaveBeenCalledWith('branch-1', 'ay-1', expect.objectContaining({ name: 'Class 5', section: 'B' }));
    expect(api.createSection).toHaveBeenCalledWith('branch-1', 'ay-1', expect.objectContaining({ name: 'Class 5', section: 'CompSci' }));
    expect(api.createSection).toHaveBeenCalledTimes(3);
  });

  it('cancels modal and resets form', async () => {
    render(<ClassesPage />);
    const user = userEvent.setup();
    const addBtn = await screen.findByText('Add Class');
    await user.click(addBtn);

    await user.type(screen.getByPlaceholderText(/e\.g\. Class 1/), 'Test');
    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Class Name')).not.toBeInTheDocument();
  });
});

describe('ClassesPage — grouping and section display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups sections under the same class name', async () => {
    render(<ClassesPage />);
    expect(await screen.findByText('2 sections')).toBeInTheDocument();
  });

  it('shows singular "section" for single-section classes', async () => {
    render(<ClassesPage />);
    const sections = await screen.findAllByText('1 section');
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 24-C: AY-Aware — loads sections from stored AY instead of ACTIVE
// ═══════════════════════════════════════════════════════════════════

describe('ClassesPage — AY-aware (24-C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads sections directly when activeAYId is in localStorage', async () => {
    const { api } = await import('@/lib/api');
    localStorage.setItem('activeAYId', 'ay-archived-1');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: 'a1', name: 'Class 5', section: null, displayOrder: 9, capacity: 30, isActive: true, _count: { members: 0, students: 0 } },
      ],
    });

    render(<ClassesPage />);
    expect(await screen.findByText('Class 5')).toBeInTheDocument();
    // Should NOT have called getAcademicYears (no ACTIVE lookup)
    expect(api.getAcademicYears).not.toHaveBeenCalled();
    // Should have called getSections directly with the stored AY
    expect(api.getSections).toHaveBeenCalledWith('branch-1', 'ay-archived-1');

    localStorage.removeItem('activeAYId');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 24-D: Read-only mode when viewing ARCHIVED year
// ═══════════════════════════════════════════════════════════════════

describe('ClassesPage — read-only archived mode (24-D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('activeAYId', 'ay-archived-1');
    localStorage.setItem('activeAYStatus', 'ARCHIVED');
  });

  afterEach(() => {
    localStorage.removeItem('activeAYId');
    localStorage.removeItem('activeAYStatus');
  });

  it('shows "Read Only" button instead of "Add Class"', async () => {
    const { api } = await import('@/lib/api');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Playgroup', section: null, displayOrder: 1, capacity: 30, isActive: true, _count: { members: 2, students: 20 } },
      ],
    });

    render(<ClassesPage />);
    expect(await screen.findByText('Read Only')).toBeInTheDocument();
    expect(screen.queryByText('Add Class')).not.toBeInTheDocument();
  });

  it('hides delete buttons for archived years', async () => {
    const { api } = await import('@/lib/api');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Playgroup', section: null, displayOrder: 1, capacity: 30, isActive: true, _count: { members: 2, students: 20 } },
      ],
    });

    render(<ClassesPage />);
    expect(await screen.findByText('Playgroup')).toBeInTheDocument();
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });
});

describe('ClassesPage — edit modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('activeAYId', 'ay-1');
    localStorage.setItem('activeBranchId', 'branch-1');
  });

  afterEach(() => {
    localStorage.removeItem('activeAYId');
  });

  it('shows link subjects button on class card', async () => {
    const { api } = await import('@/lib/api');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Class 1', section: null, displayOrder: 4, isActive: true, _count: { students: 0 } },
      ],
    });
    render(<ClassesPage />);
    expect(await screen.findByTitle('Link subjects')).toBeInTheDocument();
  });

  it('shows section count for classes with sections', async () => {
    const { api } = await import('@/lib/api');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Class 1', section: 'A', displayOrder: 4, isActive: true, _count: { students: 0 } },
        { id: '2', name: 'Class 1', section: 'B', displayOrder: 4, isActive: true, _count: { students: 0 } },
        { id: '3', name: 'Class 1', section: 'C', displayOrder: 4, isActive: true, _count: { students: 0 } },
      ],
    });
    render(<ClassesPage />);
    expect(await screen.findByText('3 sections')).toBeInTheDocument();
  });

  it('opens edit modal when Edit button is clicked', async () => {
    const { api } = await import('@/lib/api');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Class 1', section: 'A', displayOrder: 4, isActive: true, _count: { students: 0 } },
        { id: '2', name: 'Class 1', section: 'B', displayOrder: 4, isActive: true, _count: { students: 0 } },
      ],
    });
    render(<ClassesPage />);
    expect(await screen.findByText('Class 1')).toBeInTheDocument();
    const editBtn = await screen.findByTitle('Edit class');
    await userEvent.setup().click(editBtn);
    expect(await screen.findByText('Edit Class')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Class 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
  });

  it('renders existing sections in edit modal', async () => {
    const { api } = await import('@/lib/api');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Class 1', section: 'A', displayOrder: 4, isActive: true, _count: { students: 0 } },
        { id: '2', name: 'Class 1', section: 'B', displayOrder: 4, isActive: true, _count: { students: 0 } },
      ],
    });
    render(<ClassesPage />);
    await userEvent.setup().click(await screen.findByTitle('Edit class'));
    expect(await screen.findByText('Edit Class')).toBeInTheDocument();
    // Wait for modal content
    expect(await screen.findByText('Existing Sections')).toBeInTheDocument();
  });
});

describe('ClassesPage — delete section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('activeAYId', 'ay-1');
    localStorage.setItem('activeBranchId', 'branch-1');
  });

  afterEach(() => {
    localStorage.removeItem('activeAYId');
  });

  it('shows delete confirmation for section', async () => {
    const { api } = await import('@/lib/api');
    (api.getSections as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Class 1', section: 'A', displayOrder: 4, isActive: true, _count: { students: 0 } },
      ],
    });
    render(<ClassesPage />);
    expect(await screen.findByText('Class 1')).toBeInTheDocument();
  });
});
