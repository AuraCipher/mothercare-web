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

  // ─── Groups / Classes ───────────────────────────────
  getGroups: () =>
    apiRequest<{ success: boolean; data: any[] }>('/admin/groups'),

  createGroup: (data: { name: string; section?: string; displayOrder: number; capacity?: number; academicYearId?: string }) =>
    apiRequest('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    apiRequest(`/admin/groups/${id}`, { method: 'DELETE' }),

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

  completeInvitation: (token: string, data: { name: string; password: string; phone?: string }) =>
    apiRequest(`/admin/invitations/${token}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
