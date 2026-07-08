/** Client helpers for teacher portal feature gating from bootstrap permissions. */

export interface TeacherFeaturePermissions {
  classes?: { allowed: boolean };
  timetable?: { allowed: boolean };
  attendance?: { allowed: boolean; canMark?: boolean };
  marks?: { allowed: boolean; canEnter?: boolean };
  hod?: { allowed: boolean };
  announcements?: { allowed: boolean };
  notifications?: { allowed: boolean };
  profile?: { allowed: boolean };
}

const NAV_FEATURE_MAP: Record<string, keyof TeacherFeaturePermissions> = {
  '/teacher': 'classes',
  '/teacher/my-classes': 'classes',
  '/teacher/timetable': 'timetable',
  '/teacher/attendance': 'attendance',
  '/teacher/marks': 'marks',
  '/teacher/announcements': 'announcements',
  '/teacher/notifications': 'notifications',
  '/teacher/profile': 'profile',
};

export function isNavAllowed(
  href: string,
  permissions?: TeacherFeaturePermissions | null,
  isHod?: boolean,
): boolean {
  if (!permissions) return true;
  if (href.startsWith('/teacher/hod')) return isHod && (permissions.hod?.allowed ?? false);
  if (href.startsWith('/teacher/classes/') || href.startsWith('/teacher/subjects/')) {
    return permissions.classes?.allowed ?? true;
  }
  const key = NAV_FEATURE_MAP[href];
  if (!key) return true;
  return permissions[key]?.allowed ?? true;
}
