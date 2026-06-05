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

  stats: () =>
    apiRequest('/admin/stats'),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),

  // ─── Groups / Classes ───────────────────────────────
  getGroups: () =>
    apiRequest<{ success: boolean; data: any[] }>('/admin/groups'),

  createGroup: (data: { name: string; section?: string; displayOrder: number; capacity?: number; communityId?: string }) =>
    apiRequest('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    apiRequest(`/admin/groups/${id}`, { method: 'DELETE' }),
};
