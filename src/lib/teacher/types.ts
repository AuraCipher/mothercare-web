export interface TeacherAssignment {
  id: string;
  academicYearId: string;
  groupId: string;
  subjectId: string;
  isClassTeacher: boolean;
  role: string;
  group: { id: string; name: string; section: string | null };
  subject: { id: string; name: string; code: string | null };
}

export interface TeacherBootstrapData {
  user: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    role: string;
    profilePhotoId: string | null;
  };
  teacherProfile: { id: string; employeeId: string | null };
  branch: { id: string; name: string; code: string };
  academicYear: { id: string; label: string; status: string };
  portal: {
    isReadOnly: boolean;
    canWrite: boolean;
    assignmentCount: number;
    classTeacherGroupIds: string[];
  };
  assignments: TeacherAssignment[];
}

export function formatGroupLabel(group: { name: string; section: string | null }) {
  return group.section ? `${group.name} — ${group.section}` : group.name;
}

export function academicYearBanner(status: string): string | null {
  if (status === 'BUILD_STAGE') return 'School is preparing the new academic year.';
  if (status === 'ARCHIVED') return 'This academic year has ended. Read-only mode.';
  if (status === 'ON_HOLD') return 'Academic year is paused. View only.';
  return null;
}
