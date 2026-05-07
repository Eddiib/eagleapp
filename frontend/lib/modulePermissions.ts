export type Permission = `view:${string}` | `edit:${string}`;

const MODULE_PERMISSION_ALIASES: Record<string, { view: Permission; edit: Permission }> = {
  'new-booking': {
    view: 'edit:booking-sheet',
    edit: 'edit:booking-sheet',
  },
  administration: {
    view: 'view:user-management',
    edit: 'edit:user-management',
  },
};

export function modulePermission(moduleId: string, action: 'view' | 'edit' = 'view'): Permission {
  const alias = MODULE_PERMISSION_ALIASES[moduleId];
  if (alias) return alias[action];
  return `${action}:${moduleId}` as Permission;
}
