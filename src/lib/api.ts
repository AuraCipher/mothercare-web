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

  getAcademicYear: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/academic-years/${id}`),

  createAcademicYear: (branchId: string, data: { calendarId: string; previousAcademicYearId?: string }) =>
    apiRequest(`/admin/branches/${branchId}/academic-years`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  publishAcademicYear: (id: string) =>
    apiRequest(`/admin/academic-years/${id}/publish`, { method: 'PATCH' }),

  archiveAcademicYear: (id: string) =>
    apiRequest(`/admin/academic-years/${id}/archive`, { method: 'PATCH' }),

  deleteAcademicYear: (id: string) =>
    apiRequest(`/admin/academic-years/${id}`, { method: 'DELETE' }),

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

  // ─── Groups / Classes (scoped under Academic Year) ──
  getGroupsByAcademicYear: (ayId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/admin/academic-years/${ayId}/groups`),

  getGroup: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/groups/${id}`),

  createGroup: (ayId: string, data: { name: string; section?: string; displayOrder?: number; capacity?: number }) =>
    apiRequest(`/admin/academic-years/${ayId}/groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGroup: (id: string, data: { name?: string; section?: string; displayOrder?: number; capacity?: number }) =>
    apiRequest(`/admin/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    apiRequest(`/admin/groups/${id}`, { method: 'DELETE' }),

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
    userId?: string; name?: string; email?: string; username?: string; password?: string;
    employeeId?: string; qualification?: string; specialization?: string;
    joiningDate?: string; salary?: number; phone?: string; emergencyContact?: string;
    address?: string; dateOfBirth?: string; gender?: string; bloodGroup?: string;
  }) =>
    apiRequest('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTeacher: (id: string, data: {
    employeeId?: string; qualification?: string; specialization?: string;
    joiningDate?: string; salary?: number; phone?: string; emergencyContact?: string;
    address?: string; dateOfBirth?: string; gender?: string; bloodGroup?: string;
  }) =>
    apiRequest(`/admin/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTeacher: (id: string) =>
    apiRequest(`/admin/teachers/${id}`, { method: 'DELETE' }),

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

  createAssignment: (data: { academicYearId: string; teacherId: string; groupId: string; subjectId: string; isClassTeacher?: boolean }) =>
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
