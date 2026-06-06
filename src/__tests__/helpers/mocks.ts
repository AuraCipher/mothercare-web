/**
 * Test Data Factories
 *
 * Factory functions to create mock data with sensible defaults.
 * Each accepts optional overrides to customize the result.
 *
 * Usage:
 *   import { createMockGroup } from '../helpers/mocks';
 *   const group = createMockGroup({ name: 'Class 1', section: 'A' });
 */

// ─── Counter for unique IDs ───────────────────────────────

let counter = 0;
const unique = (prefix: string) => `${prefix}_${++counter}`;

// ─── Types ────────────────────────────────────────────────

export interface MockGroup {
  id: string;
  name: string;
  section: string | null;
  displayOrder: number;
  capacity: number;
  isActive: boolean;
  communityId: string;
  _count: { members: number; students: number };
}

export interface MockApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface MockUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

// ─── Factory functions ────────────────────────────────────

/**
 * Creates a mock Group object with sensible defaults.
 *
 * @param overrides - Partial fields to override
 * @returns A MockGroup
 */
export function createMockGroup(
  overrides: Partial<MockGroup> = {},
): MockGroup {
  return {
    id: unique('group'),
    name: 'Class 1',
    section: null,
    displayOrder: 1,
    capacity: 30,
    isActive: true,
    communityId: unique('comm'),
    _count: { members: 0, students: 0 },
    ...overrides,
  };
}

/**
 * Creates a response similar to what api.getGroups() returns
 *
 * @param groups - Array of groups to include
 * @returns MockApiResponse with groups data
 */
export function createMockGroupsResponse(
  groups: MockGroup[] = [],
): MockApiResponse<MockGroup[]> {
  return { success: true, data: groups };
}

/**
 * Creates a mock User with sensible defaults.
 *
 * @param overrides - Partial fields to override
 * @returns A MockUser
 */
export function createMockUser(
  overrides: Partial<MockUser> = {},
): MockUser {
  const id = overrides.id || unique('user');
  return {
    id,
    name: 'Test User',
    username: `testuser_${id.slice(0, 8)}`,
    email: `testuser_${id.slice(0, 8)}@example.com`,
    role: 'super_admin',
    status: 'active',
    ...overrides,
  };
}
