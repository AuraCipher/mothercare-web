export type DocEntityType =
  | 'student'
  | 'teacher'
  | 'staff'
  | 'canteen_supplier'
  | 'stationary_supplier';

export type DocEntity = {
  entityType: DocEntityType;
  entityId: string;
};

const DOC_PATH_RE =
  /^\/admin\/(students|teachers|staff|canteen\/suppliers|stationary\/suppliers)\/([^/]+)$/;

export function resolveDocEntityFromPath(pathname: string): DocEntity | null {
  const match = pathname.match(DOC_PATH_RE);
  if (!match) return null;

  const segment = match[1];
  const entityId = match[2];

  switch (segment) {
    case 'students':
      return { entityType: 'student', entityId };
    case 'teachers':
      return { entityType: 'teacher', entityId };
    case 'staff':
      return { entityType: 'staff', entityId };
    case 'canteen/suppliers':
      return { entityType: 'canteen_supplier', entityId };
    case 'stationary/suppliers':
      return { entityType: 'stationary_supplier', entityId };
    default:
      return null;
  }
}

export function isDocEntityPath(pathname: string): boolean {
  return DOC_PATH_RE.test(pathname);
}
