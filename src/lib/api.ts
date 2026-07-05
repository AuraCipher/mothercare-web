import config from '@/config';
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
const PUB_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || '';

/** Build branch + academic year query params from localStorage. */
function buildScopeParams(extra?: Record<string, string | undefined>): URLSearchParams {
  const q = new URLSearchParams();
  if (typeof window !== 'undefined') {
    const branchId = localStorage.getItem('activeBranchId');
    const academicYearId = localStorage.getItem('activeAYId');
    if (academicYearId) q.set('academicYearId', academicYearId);
    if (branchId) q.set('branchId', branchId);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  return q;
}

export function scopeQuery(extra?: Record<string, string | undefined>): string {
  const s = buildScopeParams(extra).toString();
  return s ? `?${s}` : '';
}

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

  const res = await fetch(`${config.apiUrl}${path}`, {
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
    apiRequest(`/admin/stats${scopeQuery()}`),

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
    apiRequest<{ success: boolean; data: any }>(`/admin/branches/${id}/stats${scopeQuery()}`),

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
  getGroups: (params?: { section?: string }) => {
    const q = buildScopeParams(params?.section ? { section: params.section } : undefined);
    const qs = q.toString();
    return apiRequest<{ success: boolean; data: any[] }>(`/admin/groups${qs ? `?${qs}` : ''}`);
  },

  createGroup: (data: { name: string; section?: string; displayOrder: number; capacity?: number; academicYearId?: string }) =>
    apiRequest('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    apiRequest(`/admin/groups/${id}`, { method: 'DELETE' }),

  // ─── Students ────────────────────────────────────────────
  getStudents: (params?: { search?: string; groupId?: string; academicYearId?: string; branchId?: string; rollNumber?: string; page?: number; limit?: number }) => {
    const q = buildScopeParams({
      search: params?.search,
      groupId: params?.groupId,
      academicYearId: params?.academicYearId,
      branchId: params?.branchId,
      rollNumber: params?.rollNumber,
      page: params?.page ? String(params.page) : undefined,
      limit: params?.limit ? String(params.limit) : undefined,
    });
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

  generateStudentCredentials: (id: string) =>
    apiRequest(`/admin/students/${id}/generate-credentials`, { method: 'PUT' }),

  setStudentPassword: (id: string, password: string, adminPassword: string) =>
    apiRequest(`/admin/students/${id}/set-password`, {
      method: 'PUT', body: JSON.stringify({ password, adminPassword }),
    }),

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

  // ─── Exam Sessions (separate module — read-only from Result & Grade hub) ──
  getExamSessions: () =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/exam-sessions${scopeQuery()}`),

  getExamSession: (sessionId: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/exam-sessions/${sessionId}${scopeQuery()}`),

  // ─── Result & Grade ─────────────────────────────────────
  getResultSessionSummary: (sessionId: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/result/sessions/${sessionId}/summary${scopeQuery()}`),

  getResultExamTypes: (sessionId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/result/sessions/${sessionId}/types${scopeQuery()}`),

  createResultExamType: (sessionId: string, data: { name: string; defaultWeight?: number }) =>
    apiRequest(`/admin/result/sessions/${sessionId}/types`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateResultExamType: (sessionId: string, typeId: string, data: { name?: string; defaultWeight?: number | null }) =>
    apiRequest(`/admin/result/sessions/${sessionId}/types/${typeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteResultExamType: (sessionId: string, typeId: string) =>
    apiRequest(`/admin/result/sessions/${sessionId}/types/${typeId}`, { method: 'DELETE' }),

  getResultExams: (sessionId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/result/sessions/${sessionId}/exams${scopeQuery()}`),

  createResultExam: (sessionId: string, data: {
    name: string;
    examTypeId: string;
    weightOverride?: number;
    startDate: string;
    endDate?: string;
  }) =>
    apiRequest(`/admin/result/sessions/${sessionId}/exams`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getResultExam: (examId: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/result/exams/${examId}${scopeQuery()}`),

  updateResultExam: (examId: string, data: {
    name?: string;
    examTypeId?: string;
    weightOverride?: number | null;
    startDate?: string;
    endDate?: string | null;
    status?: 'DRAFT' | 'ACTIVE';
  }) =>
    apiRequest(`/admin/result/exams/${examId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteResultExam: (examId: string) =>
    apiRequest(`/admin/result/exams/${examId}`, { method: 'DELETE' }),

  getResultExamStructure: (examId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/result/exams/${examId}/structure${scopeQuery()}`),

  generateResultExamStructure: (examId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/result/exams/${examId}/structure`, {
      method: 'POST',
    }),

  updateResultStructureClass: (linkId: string, data: { isActive: boolean }) =>
    apiRequest(`/admin/result/structure/classes/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateResultStructureSubject: (linkId: string, data: { isActive: boolean }) =>
    apiRequest(`/admin/result/structure/subjects/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getResultMarksGrid: (subjectLinkId: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/result/structure/subjects/${subjectLinkId}/marks-grid${scopeQuery()}`),

  saveResultMarks: (subjectLinkId: string, data: {
    totalMarks?: number;
    passingMarks?: number;
    entries: { studentId: string; marksObtained?: number | null; isAbsent?: boolean }[];
  }) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/result/structure/subjects/${subjectLinkId}/marks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteResultMarksEntry: (entryId: string) =>
    apiRequest(`/admin/result/marks/${entryId}`, { method: 'DELETE' }),

  computeResultSession: (sessionId: string) =>
    apiRequest<{ success: boolean; data: { classSubjectCount: number; studentCount: number } }>(
      `/admin/result/sessions/${sessionId}/compute-results`,
      { method: 'POST' },
    ),

  getClassResults: (sessionId: string, classId: string) =>
    apiRequest<{ success: boolean; data: any }>(
      `/admin/result/sessions/${sessionId}/classes/${classId}/results${scopeQuery()}`,
    ),

  computeReportCardsSession: (sessionId: string) =>
    apiRequest<{ success: boolean; data: { classCount: number; reportCardCount: number } }>(
      `/admin/result/sessions/${sessionId}/compute-report-cards`,
      { method: 'POST' },
    ),

  computeReportCardsClass: (sessionId: string, classId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/admin/result/sessions/${sessionId}/classes/${classId}/compute-report-cards`,
      { method: 'POST' },
    ),

  getClassReportCards: (sessionId: string, classId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/admin/result/sessions/${sessionId}/classes/${classId}/report-cards${scopeQuery()}`,
    ),

  publishReportCard: (reportCardId: string) =>
    apiRequest<{ success: boolean; data: any }>(
      `/admin/result/report-cards/${reportCardId}/publish`,
      { method: 'POST' },
    ),

  getStudentReportCard: (studentId: string, sessionId: string) =>
    apiRequest<{ success: boolean; data: any }>(
      `/admin/result/students/${studentId}/sessions/${sessionId}/report-card${scopeQuery()}`,
    ),
};
