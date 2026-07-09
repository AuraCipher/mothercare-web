export interface StudentBootstrapData {
  user: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    role: string;
    profilePhotoId: string | null;
  };
  student: {
    id: string;
    name: string;
    rollNumber: string | null;
    groupId: string | null;
    groupLabel: string | null;
  };
  branch: { id: string; name: string; code: string };
  academicYear: { id: string; label: string; status: string };
  features: { showCanteen: boolean };
}

export function academicYearBanner(status: string, label: string) {
  if (status === 'ACTIVE') return null;
  return `Viewing ${label} (${status.replace(/_/g, ' ').toLowerCase()})`;
}
