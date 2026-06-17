/**
 * Mother Care School — API Client
 *
 * Headers sent from the frontend:
 *   - x-publishable-api-key  (identifies this registered frontend)
 *   - Authorization: Bearer  (when user is logged in, takes priority)
 *
 * The secret key (sk_mcs_*) is for server-to-server / portal endpoints only.
 * It must NEVER be sent from client-side code.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const PUB_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || '';

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Always send the publishable key to identify this frontend
  if (PUB_KEY) headers['x-publishable-api-key'] = PUB_KEY;

  // If user is logged in, attach JWT (takes priority over API keys)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data as T;
}

// ─── Convenience methods ───────────────────────────────
export const api = {
  login: (identifier: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  me: () => apiRequest('/auth/me'),
  refresh: () => apiRequest('/auth/refresh', { method: 'POST' }),
  meBranches: () => apiRequest('/me/branches'),

  stats: () =>
    apiRequest('/admin/stats'),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),

  // ─── Branches ────────────────────────────────────────
  getBranches: () =>
    apiRequest<{ success: boolean; data: any[] }>('/admin/branches'),

  getBranch: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/branches/${id}`),

  createBranch: (data: { name: string; code: string; address?: string; phone?: string; email?: string }) =>
    apiRequest('/admin/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBranch: (id: string, data: { name?: string; address?: string; phone?: string; email?: string }) =>
    apiRequest(`/admin/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivateBranch: (id: string) =>
    apiRequest(`/admin/branches/${id}`, { method: 'DELETE' }),

  getBranchStats: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/branches/${id}/stats`),

  removeAdmin: (branchId: string, userId: string) =>
    apiRequest(`/admin/branches/${branchId}/remove-admin/${userId}`, { method: 'POST' }),

  // ─── Academic Calendars ──────────────────────────────
  getCalendars: () =>
    apiRequest<{ success: boolean; data: any[] }>('/admin/calendars'),

  createCalendar: (data: { label: string; startDate: string; endDate: string; isCurrent?: boolean }) =>
    apiRequest('/admin/calendars', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ─── Academic Years ──────────────────────────────────
  getAcademicYears: (branchId: string, status?: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/academic-years${status ? `?status=${status}` : ''}`),

  getAcademicYear: (branchId: string, id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/branches/${branchId}/academic-years/${id}`),

  createAcademicYear: (branchId: string, data: { calendarId: string; previousAcademicYearId?: string; directToArchived?: boolean }) =>
    apiRequest(`/admin/branches/${branchId}/academic-years`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  publishAcademicYear: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${id}/publish`, { method: 'PATCH' }),

  archiveAcademicYear: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${id}/archive`, { method: 'PATCH' }),

  pauseAcademicYear: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${id}/pause`, { method: 'PATCH' }),

  resumeAcademicYear: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${id}/resume`, { method: 'PATCH' }),

  deleteAcademicYear: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${id}`, { method: 'DELETE' }),

  // ─── API Keys (CEO only) ────────────────────────────
  getApiKeys: () =>
    apiRequest<{ success: boolean; data: any[] }>('/api-keys'),

  createApiKey: (data: { name: string; type: string; branchCode?: string }) =>
    apiRequest('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  revokeApiKey: (id: string) =>
    apiRequest(`/api-keys/${id}`, { method: 'DELETE' }),

  // ─── Sections (branch-scoped, replaces old groups) ──
  getSections: (branchId: string, ayId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/academic-years/${ayId}/sections`),

  createSection: (branchId: string, ayId: string, data: { name: string; section?: string; displayOrder: number; capacity?: number }) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${ayId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSection: (branchId: string, id: string, data: { name?: string; section?: string; displayOrder?: number; capacity?: number }) =>
    apiRequest(`/admin/branches/${branchId}/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSection: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/sections/${id}`, { method: 'DELETE' }),

  // ─── Old groups (backward compat) ───────────────────
  getGroups: () =>
    apiRequest<{ success: boolean; data: any[] }>('/admin/groups'),

  createGroup: (data: { name: string; section?: string; displayOrder: number; capacity?: number; academicYearId?: string }) =>
    apiRequest('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    apiRequest(`/admin/groups/${id}`, { method: 'DELETE' }),

  // ─── Students ────────────────────────────────────────────
  getStudents: (params?: { search?: string; groupId?: string; academicYearId?: string; rollNumber?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.groupId) q.set('groupId', params.groupId);
    if (params?.academicYearId) q.set('academicYearId', params.academicYearId);
    if (params?.rollNumber) q.set('rollNumber', params.rollNumber);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return apiRequest<{ success: boolean; data: any[]; meta: any }>(`/admin/students${qs ? `?${qs}` : ''}`);
  },

  getStudent: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/students/${id}`),

  createStudent: (data: {
    name: string; gender?: string; dateOfBirth?: string; religion?: string;
    nationality?: string; address?: string; city?: string; postalCode?: string; country?: string;
    phone?: string; bloodGroup?: string; bformCnic?: string; motherTongue?: string;
    studentEmail?: string; studentWhatsapp?: string; previousSchool?: string;
    previousClass?: string; tcNumber?: string; referredBy?: string;
    groupId?: string; admissionNumber?: string; profilePhotoId?: string;
    guardianName?: string; guardianRelation?: string;
  }) => apiRequest('/admin/students', { method: 'POST', body: JSON.stringify(data) }),

  updateStudent: (id: string, data: any) =>
    apiRequest(`/admin/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteStudent: (id: string) =>
    apiRequest(`/admin/students/${id}`, { method: 'DELETE' }),

  // ─── Users (for dropdowns) ──────────────────────────
  getUsers: (params?: { role?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return apiRequest<{ success: boolean; data: any[] }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  createUser: (data: { name: string; username: string; password: string; email?: string; phone?: string; role?: string }) =>
    apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ─── Subjects ────────────────────────────────────────────
  getSubjects: (branchId: string, ayId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/academic-years/${ayId}/subjects`),

  getSubject: (branchId: string, id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/branches/${branchId}/subjects/${id}`),

  createSubject: (branchId: string, ayId: string, data: { name: string; code?: string; description?: string; totalMarks?: number; passingMarks?: number; isElective?: boolean; hodId?: string }) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${ayId}/subjects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSubject: (branchId: string, id: string, data: { name?: string; code?: string; description?: string; totalMarks?: number; passingMarks?: number; isElective?: boolean; hodId?: string | null }) =>
    apiRequest(`/admin/branches/${branchId}/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSubject: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/subjects/${id}`, { method: 'DELETE' }),

  getSectionSubjects: (branchId: string, sectionId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/sections/${sectionId}/subjects`),

  linkSubjectGroups: (branchId: string, subjectId: string, groupIds: string[]) =>
    apiRequest(`/admin/branches/${branchId}/subjects/${subjectId}/link`, {
      method: 'POST',
      body: JSON.stringify({ groupIds }),
    }),

  unlinkSubjectGroup: (branchId: string, subjectId: string, groupId: string) =>
    apiRequest(`/admin/branches/${branchId}/subjects/${subjectId}/unlink/${groupId}`, { method: 'DELETE' }),

  // ─── Timetables (ID-based) ─────────────────────
  getTimetables: (branchId: string, ayId: string) =>
    apiRequest<{ success: boolean; data: { id: string; name: string; type: string; slotCount: number; activeDays: number }[] }>(`/admin/branches/${branchId}/academic-years/${ayId}/timetables`),

  createTimetable: (branchId: string, ayId: string, data: { name: string; type?: string }) =>
    apiRequest(`/admin/branches/${branchId}/academic-years/${ayId}/timetables`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  renameTimetable: (branchId: string, id: string, newName: string) =>
    apiRequest(`/admin/branches/${branchId}/timetables/${id}/rename`, {
      method: 'PUT', body: JSON.stringify({ newName }),
    }),

  deleteTimetable: (branchId: string, id: string) =>
    apiRequest(`/admin/branches/${branchId}/timetables/${id}`, { method: 'DELETE' }),

  // ─── Timetable Day Config (per timetable ID) ────
  getTimetableDays: (branchId: string, timetableId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/timetables/${timetableId}/days`),

  setTimetableDays: (branchId: string, timetableId: string, days: { dayOfWeek: number; isActive: boolean }[]) =>
    apiRequest(`/admin/branches/${branchId}/timetables/${timetableId}/days`, {
      method: 'PUT', body: JSON.stringify({ days }),
    }),

  // ─── Timetable Slots (per timetable ID) ──────────
  getTimetableSlots: (branchId: string, timetableId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/timetables/${timetableId}/slots`),

  createTimetableSlot: (branchId: string, timetableId: string, data: { dayOfWeek?: number | null; startTime: string; endTime: string }) =>
    apiRequest(`/admin/branches/${branchId}/timetables/${timetableId}/slots`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  deleteTimetableSlot: (branchId: string, timetableId: string, slotId: string) =>
    apiRequest(`/admin/branches/${branchId}/timetables/${timetableId}/slots/${slotId}`, { method: 'DELETE' }),

  getSectionTimetable: (branchId: string, sectionId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/sections/${sectionId}/timetable`),

  upsertTimetableEntry: (branchId: string, sectionId: string, slotId: string, data: { subjectId?: string | null; teacherId?: string | null; note?: string | null }) =>
    apiRequest(`/admin/branches/${branchId}/sections/${sectionId}/timetable/${slotId}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),

  getTeacherTimetables: (branchId: string, teacherId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/branches/${branchId}/teachers/${teacherId}/timetables`),

  // ─── Admin Invitations (CEO only) ──────────────────
  createInvitation: (email: string, branchId: string) =>
    apiRequest('/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, branchId }),
    }),

  getInvitations: () =>
    apiRequest<{ success: boolean; data: { pendingInvitations: any[]; admins: any[] } }>('/admin/invitations'),

  validateInvitation: (token: string) =>
    apiRequest<{ success: boolean; data: { email: string; branchId: string; branchName: string; branchCode: string } }>(`/admin/invitations/${token}`),

  completeInvitation: (token: string, data: { name: string; username: string; password: string; phone?: string }) =>
    apiRequest(`/admin/invitations/${token}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ─── Teachers ────────────────────────────────────────────
  getTeachers: (params?: { search?: string; qualification?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.qualification) q.set('qualification', params.qualification);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return apiRequest<{ success: boolean; data: any[]; meta: any }>(`/admin/teachers${qs ? `?${qs}` : ''}`);
  },

  getTeacher: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/teachers/${id}`),

  createTeacher: (data: {
    userId?: string; name?: string; email?: string; username?: string; password?: string; branchId?: string;
    employeeId?: string; qualification?: string; specialization?: string;
    joiningDate?: string; salary?: number; phone?: string; emergencyContact?: string;
    address?: string; dateOfBirth?: string; gender?: string; bloodGroup?: string;
    fatherName?: string; cardId?: string; severeDisease?: string; experience?: string; bio?: string;
  }) =>
    apiRequest('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTeacher: (id: string, data: {
    employeeId?: string; qualification?: string; specialization?: string;
    joiningDate?: string; salary?: number; phone?: string; emergencyContact?: string;
    address?: string; dateOfBirth?: string; gender?: string; bloodGroup?: string;
    fatherName?: string; cardId?: string; severeDisease?: string; experience?: string; bio?: string;
    profilePhotoId?: string;
  }) =>
    apiRequest(`/admin/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTeacher: (id: string) =>
    apiRequest(`/admin/teachers/${id}`, { method: 'DELETE' }),

  deactivateTeacher: (id: string) =>
    apiRequest(`/admin/teachers/${id}/deactivate`, { method: 'POST' }),

  reactivateTeacher: (id: string) =>
    apiRequest(`/admin/teachers/${id}/reactivate`, { method: 'POST' }),

  setTeacherPassword: (id: string, newPassword: string, adminPassword: string) =>
    apiRequest(`/admin/teachers/${id}/set-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, adminPassword }),
    }),

  getTeacherAssignments: (teacherId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/teachers/${teacherId}/assignments`),

  // ─── Assignments ──────────────────────────────────────────
  getGroupAssignments: (groupId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/groups/${groupId}/assignments`),

  createAssignment: (data: { academicYearId: string; teacherId: string; groupId: string; subjectId: string; isClassTeacher?: boolean; role?: string }) =>
    apiRequest('/admin/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAssignment: (id: string, data: { isClassTeacher?: boolean }) =>
    apiRequest(`/admin/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAssignment: (id: string) =>
    apiRequest(`/admin/assignments/${id}`, { method: 'DELETE' }),
};
