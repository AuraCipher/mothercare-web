/** Branch-only query for canteen API — never sends academicYearId. */
export function canteenQuery(extra?: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  if (typeof window !== 'undefined') {
    const branchId = localStorage.getItem('activeBranchId');
    if (branchId) q.set('branchId', branchId);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && v !== '') q.set(k, v);
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function formatCanteenMoney(n: number | string | { toString(): string }) {
  const v = typeof n === 'number' ? n : Number(n);
  return `Rs ${v.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export type CanteenAccessLevel = 'admin' | 'sales';

const ADMIN_BRANCH_ROLES = new Set([
  'branch_admin',
  'sub_admin',
  'management',
]);

export function resolveCanteenAccess(
  userRole: string | undefined,
  branchRole: string | undefined,
): CanteenAccessLevel | null {
  if (userRole === 'super_admin') return 'admin';
  if (branchRole && ADMIN_BRANCH_ROLES.has(branchRole)) return 'admin';
  if (branchRole === 'canteen_staff') return 'sales';
  if (userRole === 'management') return 'admin';
  return null;
}

export type CanteenProduct = {
  id: string;
  name: string;
  unitPrice: number | string;
  boxPrice?: number | string | null;
  unitsPerBox?: number | null;
  stockBoxes: number;
  stockUnits: number;
  lowStockThreshold: number;
  isActive: boolean;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string } | null;
};

export function unitsPerBoxOf(unitsPerBox?: number | null): number {
  return unitsPerBox != null && unitsPerBox > 0 ? unitsPerBox : 1;
}

export function totalStockUnits(
  product: Pick<CanteenProduct, 'stockBoxes' | 'stockUnits' | 'unitsPerBox'>,
): number {
  const upb = unitsPerBoxOf(product.unitsPerBox);
  return product.stockBoxes * upb + product.stockUnits;
}

export function formatStockDisplay(
  product: Pick<CanteenProduct, 'stockBoxes' | 'stockUnits' | 'unitsPerBox'>,
): string {
  const upb = unitsPerBoxOf(product.unitsPerBox);
  if (upb <= 1) {
    const u = product.stockUnits;
    return `${u} unit${u === 1 ? '' : 's'}`;
  }
  const parts: string[] = [];
  if (product.stockBoxes > 0) {
    parts.push(`${product.stockBoxes} box${product.stockBoxes === 1 ? '' : 'es'}`);
  }
  if (product.stockUnits > 0) {
    parts.push(`${product.stockUnits} unit${product.stockUnits === 1 ? '' : 's'}`);
  }
  if (parts.length === 0) return '0 units';
  return parts.join(' · ');
}

export function formatCanteenDateTime(value: string | Date) {
  return new Date(value).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type CanteenAccount = {
  id: string;
  displayName: string;
  displayPhone?: string | null;
  personType: string;
  runningBalance: number | string;
  student?: { id: string; name: string; rollNumber?: string | null } | null;
  user?: { id: string; name: string; role: string } | null;
};
