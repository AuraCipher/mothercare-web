/**
 * Exam Structure Subject Picker — Regression Tests
 *
 * GET /admin/branches/:branchId/sections/:sectionId/subjects returns BARE
 * subjects [{ id, name, code }] (it maps links to their subject), not link
 * rows { subject: { … } }. The picker must render those subjects inside each
 * class and pass their real ids into structure generation — otherwise every
 * class shows "No subjects linked" and Generate blocks with
 * "Select at least one subject for any class".
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/test-utils';
import ExamStructureSection from '../../app/admin/result/components/exam-structure-section';

const h = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
  api: {
    getResultExamStructure: vi.fn(),
    getSections: vi.fn(),
    getSectionSubjects: vi.fn(),
    generateResultExamStructure: vi.fn(),
    updateResultStructureClass: vi.fn(),
    updateResultStructureSubject: vi.fn(),
  },
}));

vi.mock('@/components/toast', () => ({ showToast: h.mockShowToast }));
vi.mock('@/lib/api', () => ({ api: h.api }));

const SECTIONS = [
  { id: 'g1', name: 'Play Group', section: 'A', isActive: true },
  { id: 'g2', name: 'J.M', section: null, isActive: true },
];

// Exact shape returned by GET /admin/branches/:branchId/sections/:sectionId/subjects
const SUBJECTS_BY_SECTION: Record<string, unknown[]> = {
  g1: [
    { id: 's1', name: 'Mathematics', code: 'MATH' },
    { id: 's2', name: 'English', code: null },
  ],
  g2: [{ id: 's3', name: 'Urdu', code: 'URD' }],
};

const GENERATED_STRUCTURE = [
  {
    id: 'ec1',
    examId: 'exam1',
    classId: 'g1',
    isActive: true,
    hasMarks: false,
    class: { id: 'g1', name: 'Play Group', section: 'A' },
    subjects: [
      { id: 'ecs1', isActive: true, totalMarks: null, passingMarks: null, hasMarks: false,
        subject: { id: 's1', name: 'Mathematics', code: 'MATH' } },
      { id: 'ecs2', isActive: true, totalMarks: null, passingMarks: null, hasMarks: false,
        subject: { id: 's2', name: 'English', code: null } },
    ],
  },
  {
    id: 'ec2',
    examId: 'exam1',
    classId: 'g2',
    isActive: true,
    hasMarks: false,
    class: { id: 'g2', name: 'J.M', section: null },
    subjects: [
      { id: 'ecs3', isActive: true, totalMarks: null, passingMarks: null, hasMarks: false,
        subject: { id: 's3', name: 'Urdu', code: 'URD' } },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('activeBranchId', 'b-1');
  localStorage.setItem('activeAYId', 'ay-1');
  h.api.getResultExamStructure.mockResolvedValue({ success: true, data: [] });
  h.api.getSections.mockResolvedValue({ success: true, data: SECTIONS });
  h.api.getSectionSubjects.mockImplementation((_branchId: string, sectionId: string) =>
    Promise.resolve({ success: true, data: SUBJECTS_BY_SECTION[sectionId] ?? [] }));
});

afterEach(() => {
  localStorage.clear();
});

describe('Exam structure subject picker', () => {
  it('shows linked subjects inside each class (bare subject rows)', async () => {
    render(<ExamStructureSection examId="exam1" />);

    // First class auto-expands with its subjects visible
    expect(await screen.findByText('Play Group — A')).toBeInTheDocument();
    expect(screen.getByText('2/2 subjects')).toBeInTheDocument();
    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.queryByText(/No subjects linked to this class/)).not.toBeInTheDocument();

    // Second class collapsed — expand it
    fireEvent.click(screen.getByText('J.M'));
    expect(await screen.findByText('Urdu')).toBeInTheDocument();
    expect(screen.getByText('1/1 subjects')).toBeInTheDocument();
  });

  it('generates structure with the real subject ids from selection', async () => {
    h.api.generateResultExamStructure.mockResolvedValue({ success: true, data: GENERATED_STRUCTURE });

    render(<ExamStructureSection examId="exam1" />);
    fireEvent.click(await screen.findByRole('button', { name: /Generate structure/ }));

    await waitFor(() => {
      expect(h.api.generateResultExamStructure).toHaveBeenCalledWith('exam1', {
        selections: [
          { classId: 'g1', subjectIds: ['s1', 's2'] },
          { classId: 'g2', subjectIds: ['s3'] },
        ],
      });
    });
    expect(h.mockShowToast).toHaveBeenCalledWith('success', 'Structure generated');

    // Switches to the structure view with subjects counted per class
    expect(await screen.findByText('Play Group — A')).toBeInTheDocument();
    expect(screen.getByText('2/2 subjects')).toBeInTheDocument();
    expect(screen.getByText('1/1 subjects')).toBeInTheDocument();
    fireEvent.click(screen.getByText('J.M'));
    expect(await screen.findByText('Urdu')).toBeInTheDocument();
  });
});
