import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';

const mockTeacherBootstrap = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  teacherTimetable: vi.fn(),
  teacherAnnouncements: vi.fn(),
  teacherNotifications: vi.fn(),
}));

vi.mock('@/lib/teacher/use-teacher-bootstrap', () => ({
  useTeacherBootstrap: () => mockTeacherBootstrap(),
}));
vi.mock('@/lib/api', () => ({ api: mockApi }));

import TeacherHomePage from '@/app/teacher/page';

describe('Teacher portal home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTeacherBootstrap.mockReturnValue({
      data: {
        assignments: [{ id: 'as1', groupId: 'g1', group: { name: 'Class 6', section: null }, subject: { name: 'Math', code: 'MATH' } }],
        portal: {
          assignmentCount: 1,
          isReadOnly: false,
          isHod: true,
          teachersCanMarkAttendance: true,
        },
      },
    });
    mockApi.teacherTimetable.mockResolvedValue({ success: true, data: { slots: [] } });
    mockApi.teacherAnnouncements.mockResolvedValue({ success: true, data: [{ id: 'ann1', title: 'Parent Day', content: 'Saturday' }] });
    mockApi.teacherNotifications.mockResolvedValue({ success: true, data: { unreadCount: 3 } });
  });

  it('renders dashboard stats, unread notifications, and HOD quick action', async () => {
    render(<TeacherHomePage />);
    expect(await screen.findByText('Teacher Portal')).toBeInTheDocument();
    expect(await screen.findByText('Assignments')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Department marks/i })).toBeInTheDocument();
    expect(await screen.findByText('Parent Day')).toBeInTheDocument();
  });

  it('shows no-assignment state when teacher has no assignments', async () => {
    mockTeacherBootstrap.mockReturnValue({
      data: {
        assignments: [],
        portal: {
          assignmentCount: 0,
          isReadOnly: false,
          isHod: false,
          teachersCanMarkAttendance: false,
        },
      },
    });

    render(<TeacherHomePage />);
    expect(await screen.findByText(/No classes assigned/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Department marks/i })).not.toBeInTheDocument();
  });
});
