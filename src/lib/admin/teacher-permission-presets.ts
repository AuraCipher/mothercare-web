type TeacherPortalPermissionsStored = Record<
  string,
  Record<string, string> | undefined
> & {
  parentContact?: { access?: string; view?: string; hodScope?: string };
  hod?: { access?: string; view?: string; enter?: string };
  attendance?: { access?: string; view?: string; mark?: string };
  marks?: { access?: string; view?: string; enter?: string };
};

export type PermissionPresetId =
  | 'standard_subject_teacher'
  | 'class_teacher'
  | 'hod'
  | 'view_only_auditor'
  | 'marks_entry_only'
  | 'chat_read_only';

const APP_CHAT_READ_ONLY = {
  app: {
    access: 'allow',
    schoolAnnouncementPost: 'deny',
    teachersAnnouncementPost: 'deny',
    classAnnouncementPost: 'deny',
    subjectGroupPost: 'deny',
    directMessages: 'deny',
    attachments: 'deny',
  },
} satisfies TeacherPortalPermissionsStored;

export interface TeacherPermissionPreset {
  id: PermissionPresetId;
  label: string;
  summary: string;
  portalAccess: 'FULL' | 'READ_ONLY' | 'FROZEN';
  portalPermissions: TeacherPortalPermissionsStored;
}

/** Parent contacts + HOD department marks off in every template — admin enables manually. */
const SENSITIVE_DENIED: TeacherPortalPermissionsStored = {
  parentContact: { access: 'deny', view: 'deny' },
  hod: { access: 'deny', view: 'deny', enter: 'deny' },
};

/**
 * One-click permission templates for admin.
 * Teachers still need assignments; presets only control portal capabilities.
 */
export const TEACHER_PERMISSION_PRESETS: TeacherPermissionPreset[] = [
  {
    id: 'standard_subject_teacher',
    label: 'Standard subject teacher',
    summary: 'Classes, timetable, attendance, marks. Parent phones & HOD dept marks off.',
    portalAccess: 'FULL',
    portalPermissions: {
      ...SENSITIVE_DENIED,
    },
  },
  {
    id: 'class_teacher',
    label: 'Class teacher',
    summary: 'Same as standard (homeroom via assignment). Parent phones off — enable manually if needed.',
    portalAccess: 'FULL',
    portalPermissions: {
      ...SENSITIVE_DENIED,
    },
  },
  {
    id: 'hod',
    label: 'HOD (department head)',
    summary: 'Standard teacher access. Department marks & parent phones off — enable manually per teacher.',
    portalAccess: 'FULL',
    portalPermissions: {
      ...SENSITIVE_DENIED,
    },
  },
  {
    id: 'view_only_auditor',
    label: 'View only auditor',
    summary: 'Read-only portal. Parent phones & HOD dept marks off.',
    portalAccess: 'READ_ONLY',
    portalPermissions: {
      ...SENSITIVE_DENIED,
    },
  },
  {
    id: 'marks_entry_only',
    label: 'Marks entry only',
    summary: 'Marks only, no attendance. Parent phones & HOD dept marks off.',
    portalAccess: 'FULL',
    portalPermissions: {
      attendance: { access: 'deny' },
      marks: { access: 'allow', view: 'allow', enter: 'allow' },
      ...SENSITIVE_DENIED,
    },
  },
  {
    id: 'chat_read_only',
    label: 'Mobile chat read-only',
    summary: 'Can open app chat and read channels; all posting and attachments denied.',
    portalAccess: 'FULL',
    portalPermissions: {
      ...SENSITIVE_DENIED,
      ...APP_CHAT_READ_ONLY,
    },
  },
];

export function getPermissionPreset(id: PermissionPresetId): TeacherPermissionPreset | undefined {
  return TEACHER_PERMISSION_PRESETS.find((p) => p.id === id);
}
