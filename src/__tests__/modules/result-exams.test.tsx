/**
 * Result Exams — Frontend Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import ResultGradeHubPage from '../../app/admin/result/page';
import ResultSessionPage from '../../app/admin/result/sessions/[sessionId]/page';
import ExamListSection from '../../app/admin/result/components/exam-list-section';

const mockPush = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ sessionId: 'sess1' }),
  usePathname: () => '/admin/result',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/toast', () => ({ showToast: mockShowToast }));

vi.mock('lucide-react', () => ({
  ClipboardList: 'div', ChevronRight: 'div', ChevronLeft: 'div', Calendar: 'div', Plus: 'div',
  BarChart3: 'div', TrendingUp: 'div', GraduationCap: 'div', ChevronDown: 'div',
  FileText: 'div', Settings2: 'div', Pencil: 'div',
}));

vi.mock('../../app/admin/result/components/exam-session-modal', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="session-modal"><button onClick={onClose}>Close modal</button></div> : null,
}));

vi.mock('../../app/admin/result/components/create-exam-modal', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="create-exam-modal"><button onClick={onClose}>Close exam modal</button></div> : null,
}));

vi.mock('../../app/admin/result/components/exam-type-manager-modal', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="types-modal"><button onClick={onClose}>Close types</button></div> : null,
}));

let lsStore: Record<string, string> = {};
function setupLS(extra: Record<string, string> = {}) {
  lsStore = { token: 'test-jwt', activeBranchId: 'b-1', activeAYId: 'ay-1', activeAYName: '2025-26', ...extra };
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
  { id: 'sess1', name: 'Mid Term 2026', startDate: '2026-01-01', endDate: '2026-02-01', _count: { examTypes: 2, exams: 3 } },
  { id: 'sess2', name: 'Final Term 2026', startDate: '2026-03-01', endDate: '2026-04-01', _count: { examTypes: 1, exams: 2 } },
];

const mockExams = [
  {
    id: 'exam1', name: 'Mid Term Test', status: 'ACTIVE', startDate: '2026-01-05', endDate: '2026-01-10',
    weightOverride: null, examType: { id: 't1', name: 'Written', defaultWeight: 100 },
    _count: { examClasses: 5 },
  },
  {
    id: 'exam2', name: 'Oral Exam', status: 'DRAFT', startDate: '2026-01-15', endDate: null,
    weightOverride: 50, examType: { id: 't2', name: 'Oral', defaultWeight: 30 },
    _count: { examClasses: 3 },
  },
  {
    id: 'exam3', name: 'Practical', status: 'ACTIVE', startDate: '2026-01-20', endDate: '2026-01-22',
    weightOverride: null, examType: { id: 't3', name: 'Practical', defaultWeight: 20 },
    _count: { examClasses: 4 },
  },
];

const mockSessionSummary = {
  session: { id: 'sess1', name: 'Mid Term 2026', startDate: '2026-01-01', endDate: '2026-02-01' },
  typeCount: 2,
  examCount: 3,
  subjectResultCount: 45,
  reportCardCount: 30,
  marksProgress: { total: 100, filled: 75, percent: 75 },
  exams: mockExams.map((e) => ({ id: e.id, name: e.name, status: e.status, marksProgress: { total: 10, filled: 5, percent: 50 } })),
};

const mockStructure = [
  {
    classId: 'g1', isActive: true, class: { name: 'Class 5', section: 'A' },
    subjects: [
      { isActive: true, hasMarks: true },
      { isActive: true, hasMarks: false },
    ],
  },
  {
    classId: 'g2', isActive: true, class: { name: 'Class 6', section: null },
    subjects: [{ isActive: true, hasMarks: true }],
  },
];

type FetchOpts = {
  sessions?: typeof mockSessions;
  summary?: typeof mockSessionSummary;
  exams?: typeof mockExams;
  structure?: typeof mockStructure;
  error?: boolean;
  loading?: boolean;
  onRequest?: (url: string) => void;
};

function createResultFetch(opts: FetchOpts = {}): typeof fetch {
  const sessions = opts.sessions ?? mockSessions;
  const exams = opts.exams ?? mockExams;
  if (opts.loading) return vi.fn(() => new Promise(() => {})) as typeof fetch;
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    opts.onRequest?.(url);
    if (opts.error) {
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Server error' }) } as Response);
    }
    if (url.includes('/exam-sessions') && !url.includes('/sessions/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: sessions }) } as Response);
    }
    if (url.includes('/result/sessions/') && url.includes('/summary')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: opts.summary ?? mockSessionSummary }) } as Response);
    }
    if (url.includes('/result/sessions/') && url.includes('/exams')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: exams }) } as Response);
    }
    if (url.includes('/result/exams/') && url.includes('/structure')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: opts.structure ?? mockStructure }) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) } as Response);
  }) as typeof fetch;
}

describe('ResultGradeHubPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createResultFetch(); });

  it('renders page title', async () => {
    render(<ResultGradeHubPage />);
    expect(await screen.findByText('Result & Grade')).toBeInTheDocument();
  });

  it('shows subtitle', async () => {
    render(<ResultGradeHubPage />);
    expect(await screen.findByText(/Exam sessions, marks entry/)).toBeInTheDocument();
  });

  it('shows Add session button', async () => {
    render(<ResultGradeHubPage />);
    expect(await screen.findByText('Add session')).toBeInTheDocument();
  });

  it('shows feature cards', async () => {
    render(<ResultGradeHubPage />);
    expect(await screen.findByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Report Cards')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('shows no academic year message when AY missing', async () => {
    setupLS({ activeAYId: '' });
    delete lsStore.activeAYId;
    render(<ResultGradeHubPage />);
    expect(await screen.findByText(/No academic year selected/)).toBeInTheDocument();
  });

  it('hides Add session in archived year', async () => {
    setupLS({ activeAYStatus: 'ARCHIVED' });
    render(<ResultGradeHubPage />);
    await screen.findByText('Result & Grade');
    expect(screen.queryByText('Add session')).not.toBeInTheDocument();
  });

  it('loads exam sessions on mount', async () => {
    const urls: string[] = [];
    global.fetch = createResultFetch({ onRequest: (u) => urls.push(u) });
    render(<ResultGradeHubPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/exam-sessions'))).toBe(true));
  });

  it('includes academicYearId in requests', async () => {
    const urls: string[] = [];
    global.fetch = createResultFetch({ onRequest: (u) => urls.push(u) });
    render(<ResultGradeHubPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('academicYearId=ay-1'))).toBe(true));
  });
});

describe('ResultGradeHubPage — sessions list', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createResultFetch(); });

  it.each(mockSessions.map((s) => [s.name]))('renders session %s', async (name) => {
    render(<ResultGradeHubPage />);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it('shows empty state when no sessions', async () => {
    global.fetch = createResultFetch({ sessions: [] });
    render(<ResultGradeHubPage />);
    expect(await screen.findByText(/No exam sessions for this academic year/)).toBeInTheDocument();
  });

  it('shows Create first session in empty state', async () => {
    global.fetch = createResultFetch({ sessions: [] });
    render(<ResultGradeHubPage />);
    expect(await screen.findByText('Create first session')).toBeInTheDocument();
  });

  it('shows overview stats when summaries loaded', async () => {
    render(<ResultGradeHubPage />);
    expect(await screen.findByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Exams')).toBeInTheDocument();
    expect(screen.getByText('Avg marks')).toBeInTheDocument();
    expect(screen.getByText('Report cards')).toBeInTheDocument();
  });

  it('navigates to session on click', async () => {
    render(<ResultGradeHubPage />);
    fireEvent.click(await screen.findByText('Mid Term 2026'));
    expect(mockPush).toHaveBeenCalledWith('/admin/result/sessions/sess1');
  });

  it('navigates to analytics card', async () => {
    render(<ResultGradeHubPage />);
    fireEvent.click(await screen.findByText('Analytics'));
    expect(mockPush).toHaveBeenCalledWith('/admin/result/analytics');
  });

  it('navigates to report cards card', async () => {
    render(<ResultGradeHubPage />);
    fireEvent.click(await screen.findByText('Report Cards'));
    expect(mockPush).toHaveBeenCalledWith('/admin/result/report-cards');
  });

  it('opens create session modal', async () => {
    render(<ResultGradeHubPage />);
    fireEvent.click(await screen.findByText('Add session'));
    expect(await screen.findByTestId('session-modal')).toBeInTheDocument();
  });

  it('shows error on load failure', async () => {
    global.fetch = createResultFetch({ error: true });
    render(<ResultGradeHubPage />);
    expect(await screen.findByText(/Server error|Failed to load/)).toBeInTheDocument();
  });
});

describe('ResultSessionPage — rendering', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createResultFetch(); });

  it('shows back link', async () => {
    render(<ResultSessionPage />);
    expect(await screen.findByText('All sessions')).toBeInTheDocument();
  });

  it('loads session summary and exams', async () => {
    const urls: string[] = [];
    global.fetch = createResultFetch({ onRequest: (u) => urls.push(u) });
    render(<ResultSessionPage />);
    await waitFor(() => expect(urls.some((u) => u.includes('/summary'))).toBe(true));
    expect(urls.some((u) => u.includes('/exams'))).toBe(true);
  });

  it('shows no AY message', async () => {
    setupLS();
    delete lsStore.activeAYId;
    render(<ResultSessionPage />);
    expect(await screen.findByText(/No academic year selected/)).toBeInTheDocument();
  });

  it('navigates back to hub', async () => {
    render(<ResultSessionPage />);
    fireEvent.click(await screen.findByText('All sessions'));
    expect(mockPush).toHaveBeenCalledWith('/admin/result');
  });

  it('shows error state', async () => {
    global.fetch = createResultFetch({ error: true });
    render(<ResultSessionPage />);
    expect(await screen.findByText(/Server error|Failed to load/)).toBeInTheDocument();
  });
});

describe('ExamListSection — rendering', () => {
  const progressByExamId = {
    exam1: { total: 100, filled: 75, percent: 75 },
    exam2: { total: 50, filled: 10, percent: 20 },
    exam3: { total: 80, filled: 80, percent: 100 },
  };

  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createResultFetch(); });

  it('shows empty message when no exams', () => {
    render(<ExamListSection sessionId="sess1" exams={[]} progressByExamId={{}} />);
    expect(screen.getByText(/No exams yet/)).toBeInTheDocument();
  });

  it.each(mockExams.map((e) => [e.name]))('renders exam %s', async (name) => {
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it.each(mockExams.map((e) => [e.name, e.status]))('shows status %s for %s', (name, status) => {
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    const row = screen.getByText(name).closest('div');
    expect(row?.textContent).toContain(status);
  });

  it('expands exam on chevron click', async () => {
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    const expandBtn = screen.getAllByLabelText('Expand exam')[0];
    fireEvent.click(expandBtn);
    expect(await screen.findByText(/Per-class breakdown/)).toBeInTheDocument();
  });

  it('collapses exam on second click', async () => {
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    const expandBtn = screen.getAllByLabelText('Expand exam')[0];
    fireEvent.click(expandBtn);
    fireEvent.click(screen.getByLabelText('Collapse exam'));
    expect(screen.queryByText(/Marks \d+\/\d+ slots/)).not.toBeInTheDocument();
  });

  it('navigates to exam detail on name click', async () => {
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    fireEvent.click(screen.getByText('Mid Term Test'));
    expect(mockPush).toHaveBeenCalledWith('/admin/result/sessions/sess1/exams/exam1');
  });

  it.each([
    ['exam1', 75],
    ['exam2', 20],
    ['exam3', 100],
  ])('shows %i%% progress for %s', (examId, percent) => {
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    expect(screen.getByText(new RegExp(`${percent}% marks`))).toBeInTheDocument();
  });

  it('loads class breakdown on expand', async () => {
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    fireEvent.click(screen.getAllByLabelText('Expand exam')[0]);
    fireEvent.click(await screen.findByText(/Per-class breakdown/));
    expect(await screen.findByText(/Class 5/)).toBeInTheDocument();
  });

  it('shows generate structure hint when no classes', async () => {
    global.fetch = createResultFetch({ structure: [] });
    render(<ExamListSection sessionId="sess1" exams={mockExams} progressByExamId={progressByExamId} />);
    fireEvent.click(screen.getAllByLabelText('Expand exam')[0]);
    fireEvent.click(await screen.findByText(/Per-class breakdown/));
    expect(await screen.findByText(/Generate structure on the exam page first/)).toBeInTheDocument();
  });
});

describe('ResultGradeHubPage — session metadata', () => {
  beforeEach(() => { vi.clearAllMocks(); setupLS(); global.fetch = createResultFetch(); });

  it.each([
    [3, 'exams'],
    [2, 'types'],
  ])('shows %i %s count in session row', async (count, label) => {
    render(<ResultGradeHubPage />);
    await screen.findByText('Mid Term 2026');
    const row = screen.getByText('Mid Term 2026').closest('button');
    expect(row?.textContent).toContain(String(count));
    expect(row?.textContent).toContain(label);
  });

  it('shows loading skeletons', async () => {
    global.fetch = createResultFetch({ loading: true });
    render(<ResultGradeHubPage />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
