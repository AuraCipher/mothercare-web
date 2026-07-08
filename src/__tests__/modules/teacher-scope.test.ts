import { describe, it, expect } from 'vitest';
import {
  assignmentById,
  assignmentsForGroup,
  canAccessGroup,
} from '@/lib/teacher/scope';
import type { TeacherAssignment } from '@/lib/teacher/types';

const SAMPLE: TeacherAssignment[] = [
  {
    id: 'a1',
    academicYearId: 'ay1',
    groupId: 'g1',
    subjectId: 's1',
    isClassTeacher: true,
    role: 'primary',
    group: { id: 'g1', name: 'Class 5', section: null },
    subject: { id: 's1', name: 'Mathematics', code: 'MATH' },
  },
  {
    id: 'a2',
    academicYearId: 'ay1',
    groupId: 'g1',
    subjectId: 's2',
    isClassTeacher: false,
    role: 'primary',
    group: { id: 'g1', name: 'Class 5', section: null },
    subject: { id: 's2', name: 'English', code: 'ENG' },
  },
  {
    id: 'a3',
    academicYearId: 'ay1',
    groupId: 'g2',
    subjectId: 's1',
    isClassTeacher: false,
    role: 'primary',
    group: { id: 'g2', name: 'Class 6', section: null },
    subject: { id: 's1', name: 'Mathematics', code: 'MATH' },
  },
];

describe('teacher scope helpers', () => {
  it('filters assignments by group', () => {
    expect(assignmentsForGroup(SAMPLE, 'g1')).toHaveLength(2);
    expect(assignmentsForGroup(SAMPLE, 'g2')).toHaveLength(1);
    expect(assignmentsForGroup(SAMPLE, 'missing')).toHaveLength(0);
  });

  it('finds assignment by id', () => {
    expect(assignmentById(SAMPLE, 'a2')?.subject.code).toBe('ENG');
    expect(assignmentById(SAMPLE, 'nope')).toBeUndefined();
  });

  it('checks group access from bootstrap assignments', () => {
    expect(canAccessGroup(SAMPLE, 'g1')).toBe(true);
    expect(canAccessGroup(SAMPLE, 'g2')).toBe(true);
    expect(canAccessGroup(SAMPLE, 'other')).toBe(false);
  });
});
