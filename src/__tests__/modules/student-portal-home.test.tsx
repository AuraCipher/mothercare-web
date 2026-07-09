import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/test-utils';

const mockStudentBootstrap = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  studentTimetable: vi.fn(),
  studentAnnouncements: vi.fn(),
  studentAttendance: vi.fn(),
  studentFees: vi.fn(),
}));

vi.mock('@/lib/student/use-student-bootstrap', () => ({
  useStudentBootstrap: () => mockStudentBootstrap(),
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

import StudentHomePage from '@/app/student/page';

describe('Student portal home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStudentBootstrap.mockReturnValue({
      data: {
        student: { name: 'Ahmed Khan', groupLabel: 'Jr Montessori' },
        features: { showCanteen: true },
      },
    });
    mockApi.studentTimetable.mockResolvedValue({
      success: true,
      data: { slots: [{ dayOfWeek: null, lectureNumber: 1, startTime: '08:00', endTime: '08:40', subject: { name: 'Math' }, teacher: { name: 'Ms. A' } }] },
    });
    mockApi.studentAnnouncements.mockResolvedValue({
      success: true,
      data: [{ id: 'a1', title: 'Holiday', content: 'Friday off' }],
    });
    mockApi.studentAttendance.mockResolvedValue({ success: true, data: { summary: { percentage: 94 } } });
    mockApi.studentFees.mockResolvedValue({ success: true, data: { summary: { balanceDuePaise: 120000 } } });
  });

  it('renders stats and quick links from bootstrap and api data', async () => {
    render(<StudentHomePage />);
    expect(screen.getByText('Hello, Ahmed')).toBeInTheDocument();
    expect((await screen.findAllByText('Jr Montessori')).length).toBeGreaterThan(0);
    expect(await screen.findByText('94%')).toBeInTheDocument();
    expect(await screen.findByText('Rs 1,200')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Canteen' })).toBeInTheDocument();
    expect(await screen.findByText('Holiday')).toBeInTheDocument();
  });

  it('hides canteen quick link when feature flag is disabled', async () => {
    mockStudentBootstrap.mockReturnValue({
      data: {
        student: { name: 'Ahmed Khan', groupLabel: 'Jr Montessori' },
        features: { showCanteen: false },
      },
    });
    render(<StudentHomePage />);
    await waitFor(() => expect(mockApi.studentTimetable).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: 'Canteen' })).not.toBeInTheDocument();
  });
});
