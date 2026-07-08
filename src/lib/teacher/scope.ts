import type { TeacherAssignment } from './types';

export function assignmentsForGroup(assignments: TeacherAssignment[], groupId: string) {
  return assignments.filter((row) => row.groupId === groupId);
}

export function assignmentById(assignments: TeacherAssignment[], assignmentId: string) {
  return assignments.find((row) => row.id === assignmentId);
}

export function canAccessGroup(assignments: TeacherAssignment[], groupId: string) {
  return assignments.some((row) => row.groupId === groupId);
}
