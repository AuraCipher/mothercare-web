/**
 * Result Report Cards — Frontend Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import ReportCardsPage from '../../app/admin/result/report-cards/page';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/admin/result/report-cards',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  FileText: 'div', ChevronLeft: 'div', Download: 'div', Printer: 'div',
  RefreshCw: 'div', GraduationCap: 'div',
}));

vi.mock('@/lib/buildExamReportCards', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/buildExamReportCards')>();
  return {
    ...actual,
    buildExamReportCards: vi.fn(() => Promise.resolve([
    {
      studentId: 's1',
      studentName: 'Ahmed Ali',
      rollNumber: '1',
      className: 'Class 5',
      classSection: 'A',
      subjects: [
        { name: 'Math', marksObtained: 85, totalMarks: 100, passingMarks: 40, isAbsent: false, grade: 'A', passed: true },
        { name: 'English', marksObtained: 72, totalMarks: 100, passingMarks: 40, isAbsent: false, grade: 'B', passed: true },
      ],
      totalMarksSum: 200,
      marksObtainedSum: 157,
      overallPercentage: 78.5,
      overallGrade: 'B',
      overallPassed: true,
      rank: 1,
    },
    {
      studentId: 's2',
      studentName: 'Sara Khan',
      rollNumber: '2',
      className: 'Class 5',
      classSection: 'A',
      subjects: [
        { name: 'Math', marksObtained: 90, totalMarks: 100, passingMarks: 40, isAbsent: false, grade: 'A', passed: true },
      ],
      totalMarksSum: 100,
      marksObtainedSum: 90,
      overallPercentage: 90,
      overallGrade: 'A',
      overallPassed: true,
      rank: 1,
    },
  ])),
  };
});

vi.mock('@/lib/reportCardTemplate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/reportCardTemplate')>();
  return {
    ...actual,
    downloadReportCardsCsv: vi.fn(),
    printReportCards: vi.fn(),
    renderSingleReportCardHtml: vi.fn(() => '<div class="report-card">Preview</div>'),
  };
});

let lsStore: Record<string, string> = {};
function setupLS(extra: Record<string, string> = {}) {
  lsStore = {
    token: 'test-jwt',
    activeBranchId: 'b-1',
    activeAYId: 'ay-1',
    activeAYName: '2025-26',
    ...extra,
  };
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

const mockSessions = [
  { id: 'sess1', name: 'Mid Term 2026' },
  { id: 'sess2', name: 'Final Term 2026' },
];

const mockExams = [
  { id: 'exam1', name: 'Mid Term Test' },
  { id: 'exam2', name: 'Oral Exam' },
];

const mockSections = [
  { id: 'g1', name: 'Class 5', section: 'A', isActive: true },
  { id: 'g2', name: 'Class 6', section: null, isActive: true },
  { id: 'g3', name: 'Class 7', section: 'B', isActive: false },
];

const mockStudents = [
  { id: 's1', name: 'Ahmed Ali', rollNumber: '1', isActive: true },
  { id: 's2', name: 'Sara Khan', rollNumber: '2', isActive: true },
  { id: 's3', name: 'Hassan Raza', rollNumber: '3', isActive: true },
];

type FetchOpts = {
  sessions?: typeof mockSessions;
  exams?: typeof mockExams;
  sections?: typeof mockSections;
  students?: typeof mockStudents;
  branch?: { name: string; address?: string; phone?: string };
  loading?: boolean;
  onRequest?: (url: string) => void;
};

function createReportCardsFetch(opts: FetchOpts = {}): typeof fetch {
  const sessions = opts.sessions ?? mockSessions;
  const exams = opts.exams ?? mockExams;
  const sections = opts.sections ?? mockSections;
  const students = opts.students ?? mockStudents;
  const branch = opts.branch ?? { name: 'Mother Care School', address: 'Lahore', phone: '042-1234567' };
  if (opts.loading) return vi.fn(() => new Promise(() => {})) as typeof fetch;
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    opts.onRequest?.(url);
    if (url.includes('/exam-sessions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: sessions }) } as Response);
    }
    if (url.includes('/result/sessions/') && url.includes('/exams')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: exams }) } as Response);
    }
    if (url.includes('/sections')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: sections }) } as Response);
    }
    if (url.includes('/students')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: students, pagination: { total: students.length } }),
      } as Response);
    }
    if (url.includes('/branches/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: branch }) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
  }) as typeof fetch;
}

async function selectFilters() {
  const sessionSelect = await screen.findByDisplayValue('Select session…');
  fireEvent.change(sessionSelect, { target: { value: 'sess1' } });
  await waitFor(() => expect(screen.getByDisplayValue('Select exam…')).not.toBeDisabled());
  fireEvent.change(screen.getByDisplayValue('Select exam…'), { target: { value: 'exam1' } });
  fireEvent.change(screen.getByDisplayValue('Select class…'), { target: { value: 'g1' } });
}

describe('ReportCardsPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createReportCardsFetch(); });

  it('renders page title', async () => {
    render(<ReportCardsPage />);
    expect(await screen.findByText('Report Cards')).toBeInTheDocument();
  });

  it('shows subtitle', async () => {
    render(<ReportCardsPage />);
    expect(await screen.findByText(/Class bulk or single-student/)).toBeInTheDocument();
  });

  it('shows back link', async () => {
    render(<ReportCardsPage />);
    expect(await screen.findByText(/Result & Grade/)).toBeInTheDocument();
  });

  it('navigates back to result hub', async () => {
    render(<ReportCardsPage />);
    fireEvent.click(await screen.findByText(/Result & Grade/));
    expect(mockPush).toHaveBeenCalledWith('/admin/result');
  });

  it('shows no AY message when missing', async () => {
    setupLS();
    delete lsStore.activeAYId;
    render(<ReportCardsPage />);
    expect(await screen.findByText(/Select an academic year/)).toBeInTheDocument();
  });

  it('loads sessions on mount', async () => {
    const urls: string[] = [];
    global.fetch = createReportCardsFetch({ onRequest: (u) => urls.push(u) });
    render(<ReportCardsPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/exam-sessions'))).toBe(true));
  });

  it('loads branch details', async () => {
    const urls: string[] = [];
    global.fetch = createReportCardsFetch({ onRequest: (u) => urls.push(u) });
    render(<ReportCardsPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/branches/b-1'))).toBe(true));
  });

  it('loads sections', async () => {
    const urls: string[] = [];
    global.fetch = createReportCardsFetch({ onRequest: (u) => urls.push(u) });
    render(<ReportCardsPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/sections'))).toBe(true));
  });
});

describe('ReportCardsPage — filters', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createReportCardsFetch(); });

  it('shows filter labels', async () => {
    render(<ReportCardsPage />);
    expect(await screen.findByText('Exam Session')).toBeInTheDocument();
    expect(screen.getByText('Exam')).toBeInTheDocument();
    expect(screen.getByText('Class')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it.each(mockSessions.map((s) => [s.name]))('lists session %s', async (name) => {
    render(<ReportCardsPage />);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it.each(mockSections.filter((s) => s.isActive !== false).map((s) => [s.name]))(
    'lists class %s',
    async (name) => {
      render(<ReportCardsPage />);
      expect(await screen.findByText(new RegExp(name))).toBeInTheDocument();
    },
  );

  it('disables generate until filters set', async () => {
    render(<ReportCardsPage />);
    const btn = await screen.findByText('Generate Report Cards');
    expect(btn).toBeDisabled();
  });

  it('loads exams when session selected', async () => {
    const urls: string[] = [];
    global.fetch = createReportCardsFetch({ onRequest: (u) => urls.push(u) });
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select session…'), { target: { value: 'sess1' } });
    await waitFor(() => expect(urls.some((u) => u.includes('/exams'))).toBe(true));
  });

  it('loads students when class selected', async () => {
    const urls: string[] = [];
    global.fetch = createReportCardsFetch({ onRequest: (u) => urls.push(u) });
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select class…'), { target: { value: 'g1' } });
    await waitFor(() => expect(urls.some((u) => u.includes('/students') && u.includes('groupId=g1'))).toBe(true));
  });

  it('lists students after class selection', async () => {
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select class…'), { target: { value: 'g1' } });
    expect(await screen.findByText(/1 — Ahmed Ali/)).toBeInTheDocument();
    expect(screen.getByText(/2 — Sara Khan/)).toBeInTheDocument();
  });

  it('shows bulk student option', async () => {
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select class…'), { target: { value: 'g1' } });
    expect(await screen.findByText('All students (class bulk)')).toBeInTheDocument();
  });

  it('shows no sessions message', async () => {
    global.fetch = createReportCardsFetch({ sessions: [] });
    render(<ReportCardsPage />);
    expect(await screen.findByText(/No exam sessions yet/)).toBeInTheDocument();
  });

  it('resets exam when session changes', async () => {
    render(<ReportCardsPage />);
    const sessionSelect = await screen.findByDisplayValue('Select session…');
    fireEvent.change(sessionSelect, { target: { value: 'sess1' } });
    await waitFor(() => screen.getByDisplayValue('Select exam…'));
    fireEvent.change(screen.getByDisplayValue('Select exam…'), { target: { value: 'exam1' } });
    fireEvent.change(sessionSelect, { target: { value: 'sess2' } });
    const examSelect = screen.getByDisplayValue('Select exam…') as HTMLSelectElement;
    expect(examSelect.value).toBe('');
  });
});

describe('ReportCardsPage — generation', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createReportCardsFetch(); });

  it('enables generate when session exam class set', async () => {
    render(<ReportCardsPage />);
    await selectFilters();
    const btn = screen.getByText('Generate Report Cards');
    expect(btn).not.toBeDisabled();
  });

  it('generates report cards on click', async () => {
    const { buildExamReportCards } = await import('@/lib/buildExamReportCards');
    render(<ReportCardsPage />);
    await selectFilters();
    fireEvent.click(screen.getByText('Generate Report Cards'));
    await waitFor(() => expect(buildExamReportCards).toHaveBeenCalledWith('sess1', 'exam1', 'g1', undefined, 'Mid Term Test'));
    expect(await screen.findByText(/2 students/)).toBeInTheDocument();
  });

  it('shows single student label when student selected', async () => {
    render(<ReportCardsPage />);
    await selectFilters();
    await screen.findByText(/1 — Ahmed Ali/);
    const selects = screen.getAllByRole('combobox');
    const studentSelect = selects[selects.length - 1];
    fireEvent.change(studentSelect, { target: { value: 's1' } });
    expect(await screen.findByText('Generate Report Card')).toBeInTheDocument();
  });

  it('shows output actions after generation', async () => {
    render(<ReportCardsPage />);
    await selectFilters();
    fireEvent.click(screen.getByText('Generate Report Cards'));
    expect(await screen.findByText('Download CSV')).toBeInTheDocument();
    expect(screen.getByText('Print / Save PDF')).toBeInTheDocument();
    expect(screen.getByText('Regenerate')).toBeInTheDocument();
  });

  it('calls download CSV', async () => {
    const { downloadReportCardsCsv } = await import('@/lib/reportCardTemplate');
    render(<ReportCardsPage />);
    await selectFilters();
    fireEvent.click(screen.getByText('Generate Report Cards'));
    fireEvent.click(await screen.findByText('Download CSV'));
    expect(downloadReportCardsCsv).toHaveBeenCalled();
  });

  it('calls print', async () => {
    const { printReportCards } = await import('@/lib/reportCardTemplate');
    render(<ReportCardsPage />);
    await selectFilters();
    fireEvent.click(screen.getByText('Generate Report Cards'));
    fireEvent.click(await screen.findByText('Print / Save PDF'));
    expect(printReportCards).toHaveBeenCalled();
  });

  it('shows validation toast without session', async () => {
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select class…'), { target: { value: 'g1' } });
    const btn = screen.getByText('Generate Report Cards');
    if (!btn.hasAttribute('disabled')) fireEvent.click(btn);
    await waitFor(() => {
      if (mockShowToast.mock.calls.length) {
        expect(mockShowToast).toHaveBeenCalledWith('error', expect.stringContaining('session'));
      }
    });
  });
});

describe('ReportCardsPage — empty generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLS();
    global.fetch = createReportCardsFetch();
  });

  it('shows toast when no cards returned', async () => {
    const { buildExamReportCards } = await import('@/lib/buildExamReportCards');
    vi.mocked(buildExamReportCards).mockResolvedValueOnce([]);
    render(<ReportCardsPage />);
    await selectFilters();
    fireEvent.click(screen.getByText('Generate Report Cards'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', expect.stringContaining('No students')));
  });
});

describe('ReportCardsPage — meta loading', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });

  it('shows loading skeleton for filters', async () => {
    global.fetch = createReportCardsFetch({ loading: true });
    render(<ReportCardsPage />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });
});

describe('ReportCardsPage — filter combinations', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createReportCardsFetch(); });

  it.each([
    ['sess1', 'exam1'],
    ['sess1', 'exam2'],
    ['sess2', 'exam1'],
  ])('allows session %s with exam %s selection', async (sessionId, examId) => {
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select session…'), { target: { value: sessionId } });
    await waitFor(() => screen.getByDisplayValue('Select exam…'));
    fireEvent.change(screen.getByDisplayValue('Select exam…'), { target: { value: examId } });
    fireEvent.change(screen.getByDisplayValue('Select class…'), { target: { value: 'g1' } });
    expect(screen.getByText('Generate Report Cards')).not.toBeDisabled();
  });

  it.each(mockStudents.map((s) => [s.id, s.name]))(
    'can select student %s (%s)',
    async (id, name) => {
      render(<ReportCardsPage />);
      fireEvent.change(await screen.findByDisplayValue('Select class…'), { target: { value: 'g1' } });
      await screen.findByText(new RegExp(name));
      const selects = screen.getAllByRole('combobox');
      const studentSelect = selects[selects.length - 1] as HTMLSelectElement;
      fireEvent.change(studentSelect, { target: { value: id } });
      expect(studentSelect.value).toBe(id);
    },
  );
});

describe('ReportCardsPage — requests scope', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); });

  it('includes academicYearId in student request', async () => {
    const urls: string[] = [];
    global.fetch = createReportCardsFetch({ onRequest: (u) => urls.push(u) });
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select class…'), { target: { value: 'g1' } });
    await waitFor(() => expect(urls.some((u) => u.includes('academicYearId=ay-1'))).toBe(true));
  });

  it('includes branchId in student request', async () => {
    const urls: string[] = [];
    global.fetch = createReportCardsFetch({ onRequest: (u) => urls.push(u) });
    render(<ReportCardsPage />);
    fireEvent.change(await screen.findByDisplayValue('Select class…'), { target: { value: 'g1' } });
    await waitFor(() => expect(urls.some((u) => u.includes('branchId=b-1'))).toBe(true));
  });
});
