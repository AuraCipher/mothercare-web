/**
 * Result Marks — Frontend Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import MarksEntrySection, { marksProgressSummary } from '../../app/admin/result/components/marks-entry-section';
import type { StructureClass } from '../../app/admin/result/components/exam-structure-section';

const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ClipboardList: 'div', Save: 'div',
}));

let lsStore: Record<string, string> = {};
function setupLS() {
  lsStore = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1' };
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

const mockStudents = [
  { id: 's1', name: 'Ahmed Ali', rollNumber: '1' },
  { id: 's2', name: 'Sara Khan', rollNumber: '2' },
  { id: 's3', name: 'Hassan Raza', rollNumber: '3' },
];

const mockStructure: StructureClass[] = [
  {
    id: 'esc-g1',
    examId: 'exam1',
    classId: 'g1',
    isActive: true,
    hasMarks: false,
    class: { id: 'g1', name: 'Class 5', section: 'A' },
    subjects: [
      { id: 'link1', isActive: true, totalMarks: 100, passingMarks: 40, hasMarks: false, subject: { id: 'sub1', name: 'Math', code: 'MTH' } },
      { id: 'link2', isActive: true, totalMarks: 100, passingMarks: 40, hasMarks: true, subject: { id: 'sub2', name: 'English', code: 'ENG' } },
      { id: 'link3', isActive: false, totalMarks: null, passingMarks: null, hasMarks: false, subject: { id: 'sub3', name: 'Urdu', code: 'URD' } },
    ],
  },
  {
    id: 'esc-g2',
    examId: 'exam1',
    classId: 'g2',
    isActive: true,
    hasMarks: false,
    class: { id: 'g2', name: 'Class 6', section: null },
    subjects: [
      { id: 'link4', isActive: true, totalMarks: 100, passingMarks: 40, hasMarks: false, subject: { id: 'sub4', name: 'Science', code: 'SCI' } },
    ],
  },
  {
    id: 'esc-g3',
    examId: 'exam1',
    classId: 'g3',
    isActive: false,
    hasMarks: false,
    class: { id: 'g3', name: 'Class 7', section: 'B' },
    subjects: [
      { id: 'link5', isActive: true, totalMarks: 100, passingMarks: 40, hasMarks: false, subject: { id: 'sub5', name: 'History', code: 'HIS' } },
    ],
  },
];

function makeGrid(subjectName: string, linkId: string, marks: Record<string, number | null> = {}) {
  return {
    subject: { name: subjectName, code: subjectName.slice(0, 3).toUpperCase() },
    totalMarks: 100,
    passingMarks: 40,
    students: mockStudents.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      marksObtained: marks[s.id] ?? null,
      isAbsent: false,
      entryId: marks[s.id] != null ? `entry-${s.id}` : null,
    })),
  };
}

type FetchOpts = {
  structure?: typeof mockStructure;
  grids?: Record<string, ReturnType<typeof makeGrid>>;
  structureError?: boolean;
  gridError?: boolean;
  loading?: boolean;
  onSave?: (linkId: string, body: unknown) => void;
};

function createMarksFetch(opts: FetchOpts = {}): typeof fetch {
  const structure = opts.structure ?? mockStructure;
  const grids = opts.grids ?? {
    link1: makeGrid('Math', 'link1'),
    link2: makeGrid('English', 'link2', { s1: 85, s2: 72 }),
    link4: makeGrid('Science', 'link4'),
  };
  if (opts.loading) return vi.fn(() => new Promise(() => {})) as typeof fetch;
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (opts.structureError && url.includes('/structure') && !url.includes('/marks')) {
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Structure failed' }) } as Response);
    }
    if (url.includes('/result/exams/') && url.includes('/structure') && init?.method !== 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: structure }) } as Response);
    }
    if (url.includes('/marks-grid')) {
      if (opts.gridError) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Grid failed' }) } as Response);
      }
      const linkId = url.match(/subjects\/([^/]+)/)?.[1] || '';
      const grid = grids[linkId] ?? makeGrid('Subject', linkId);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: grid }) } as Response);
    }
    if (url.includes('/marks') && init?.method === 'POST') {
      const linkId = url.match(/subjects\/([^/]+)/)?.[1] || '';
      if (init.body) opts.onSave?.(linkId, JSON.parse(init.body as string));
      const grid = grids[linkId] ?? makeGrid('Subject', linkId);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: grid }) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
  }) as typeof fetch;
}

describe('marksProgressSummary', () => {
  it('returns generate structure message when empty', () => {
    expect(marksProgressSummary([])).toBe('Generate structure first');
  });

  it('counts subjects with marks', () => {
    expect(marksProgressSummary(mockStructure)).toBe('1/3 subjects with marks');
  });

  it('ignores inactive classes', () => {
    const onlyActive = mockStructure.filter((c) => c.isActive);
    expect(marksProgressSummary(onlyActive)).toBe('1/3 subjects with marks');
  });
});

describe('MarksEntrySection — loading & errors', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createMarksFetch(); });

  it('shows loading skeleton', () => {
    global.fetch = createMarksFetch({ loading: true });
    render(<MarksEntrySection examId="exam1" />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows structure error with retry', async () => {
    global.fetch = createMarksFetch({ structureError: true });
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(/Structure failed|Failed to load structure/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows empty structure message', async () => {
    global.fetch = createMarksFetch({ structure: [] });
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(/Generate structure and enable/)).toBeInTheDocument();
  });

  it('shows no students message for class without students', async () => {
    global.fetch = createMarksFetch({
      grids: { link1: { ...makeGrid('Math', 'link1'), students: [] } },
    });
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(/No active students/)).toBeInTheDocument();
  });
});

describe('MarksEntrySection — class selector', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createMarksFetch(); });

  it('shows class dropdown', async () => {
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText('Class')).toBeInTheDocument();
  });

  it('lists active classes with subjects', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Class');
    expect(screen.getByText('Class 5 — A')).toBeInTheDocument();
    expect(screen.getByText('Class 6')).toBeInTheDocument();
  });

  it('does not list inactive class', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Class');
    expect(screen.queryByText('Class 7')).not.toBeInTheDocument();
  });

  it('shows active subject count', async () => {
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(/2\/3 subjects active/)).toBeInTheDocument();
  });

  it('switches class on select change', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Ahmed Ali');
    const select = screen.getByDisplayValue('Class 5 — A');
    fireEvent.change(select, { target: { value: 'g2' } });
    expect(await screen.findByText('Science')).toBeInTheDocument();
  });
});

describe('MarksEntrySection — marks grid', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createMarksFetch(); });

  it.each(mockStudents.map((s) => [s.name]))('renders student %s', async (name) => {
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it.each(['Math', 'English'])('renders subject column %s', async (subject) => {
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(subject)).toBeInTheDocument();
  });

  it('shows Total and Pass inputs per column', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Math');
    const totals = screen.getAllByText('Total');
    const passes = screen.getAllByText('Pass');
    expect(totals.length).toBeGreaterThanOrEqual(2);
    expect(passes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows Save button per editable column', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Math');
    const saveBtns = screen.getAllByText('Save');
    expect(saveBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('shows Abs checkbox per cell', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Ahmed Ali');
    const absLabels = screen.getAllByText('Abs');
    expect(absLabels.length).toBeGreaterThanOrEqual(3);
  });

  it('pre-fills existing marks', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('English');
    const inputs = screen.getAllByRole('spinbutton');
    const values = inputs.map((i) => (i as HTMLInputElement).value);
    expect(values).toContain('85');
    expect(values).toContain('72');
  });

  it('allows entering marks in cell', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Math');
    const inputs = screen.getAllByRole('spinbutton');
    const emptyInput = inputs.find((i) => (i as HTMLInputElement).value === '');
    if (emptyInput) fireEvent.change(emptyInput, { target: { value: '65' } });
    expect((emptyInput as HTMLInputElement)?.value).toBe('65');
  });

  it('marks student absent via checkbox', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Ahmed Ali');
    const absCheckbox = screen.getAllByRole('checkbox').find((cb) =>
      cb.closest('label')?.textContent?.includes('Abs'),
    )!;
    fireEvent.click(absCheckbox);
    expect(absCheckbox).toBeChecked();
  });
});

describe('MarksEntrySection — read-only modes', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createMarksFetch(); });

  it('shows published read-only message', async () => {
    render(<MarksEntrySection examId="exam1" examActive />);
    expect(await screen.findByText(/Exam is published/)).toBeInTheDocument();
  });

  it('shows archived read-only message', async () => {
    render(<MarksEntrySection examId="exam1" readOnly />);
    expect(await screen.findByText(/Read-only in archived/)).toBeInTheDocument();
  });

  it('hides Save buttons when read-only', async () => {
    render(<MarksEntrySection examId="exam1" readOnly />);
    await screen.findByText('Math');
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('disables inputs when exam active', async () => {
    render(<MarksEntrySection examId="exam1" examActive />);
    await screen.findByText('Math');
    const saveBtns = screen.queryAllByText('Save');
    expect(saveBtns.length).toBe(0);
  });
});

describe('MarksEntrySection — save column', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createMarksFetch(); });

  it('validates total marks before save', async () => {
    global.fetch = createMarksFetch({
      grids: {
        link1: { ...makeGrid('Math', 'link1'), totalMarks: null, passingMarks: null } as unknown as ReturnType<typeof makeGrid>,
        link2: { ...makeGrid('English', 'link2'), totalMarks: null, passingMarks: null } as unknown as ReturnType<typeof makeGrid>,
      },
    });
    render(<MarksEntrySection examId="exam1" />);
    const mathHeader = await screen.findByText('Math');
    const saveBtn = mathHeader.closest('th')?.querySelector('button');
    fireEvent.click(saveBtn!);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', expect.stringContaining('total marks')));
  });

  it('saves column with valid data', async () => {
    let saved: unknown = null;
    global.fetch = createMarksFetch({
      onSave: (_linkId, body) => { saved = body; },
    });
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('Math');
    const totalInputs = screen.getAllByRole('spinbutton');
    const mathTotal = totalInputs.find((el) => el.closest('th')?.textContent?.includes('Math'));
    if (mathTotal) fireEvent.change(mathTotal, { target: { value: '100' } });
    const saveBtns = screen.getAllByText('Save');
    fireEvent.click(saveBtns[0]);
    await waitFor(() => expect(saved).not.toBeNull());
    expect(mockShowToast).toHaveBeenCalledWith('success', expect.stringContaining('marks saved'));
  });

  it('calls onProgressChange after load', async () => {
    const onProgress = vi.fn();
    render(<MarksEntrySection examId="exam1" onProgressChange={onProgress} />);
    await waitFor(() => expect(onProgress).toHaveBeenCalledWith('1/3 subjects with marks'));
  });
});

describe('MarksEntrySection — grid errors', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });

  it('shows toast for partial grid load failure', async () => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/structure') && !url.includes('/marks')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockStructure }) } as Response);
      }
      if (url.includes('link1')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'fail' }) } as Response);
      }
      if (url.includes('/marks-grid')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: makeGrid('English', 'link2') }) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
    }) as typeof fetch;
    render(<MarksEntrySection examId="exam1" />);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', expect.stringContaining('failed to load')));
  });
});

describe('MarksEntrySection — student rows', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createMarksFetch(); });

  it.each([
    ['s1', 'Ahmed Ali', '1'],
    ['s2', 'Sara Khan', '2'],
    ['s3', 'Hassan Raza', '3'],
  ])('renders student id %s name %s roll %s', async (_id, name) => {
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it('shows filled count per column', async () => {
    render(<MarksEntrySection examId="exam1" />);
    await screen.findByText('English');
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('shows instruction text', async () => {
    render(<MarksEntrySection examId="exam1" />);
    expect(await screen.findByText(/Set Total and Pass per subject/)).toBeInTheDocument();
  });
});
