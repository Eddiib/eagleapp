import { ActivityLog } from '../types/partner';

/**
 * Audit logging utility for Partners module
 * Tracks all CRUD operations and status changes
 */

export type AuditAction = 'Create' | 'Edit' | 'Status Change' | 'Delete' | 'Document Upload' | 'Note Added';

export interface AuditEntry {
  action: AuditAction;
  description: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

/**
 * Get current user - In a real app, this would come from auth context
 */
export const getCurrentUser = (): string => {
  return 'Current User'; // Replace with actual user from auth
};

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Create an audit log entry
 */
export const createAuditLog = (
  action: AuditAction,
  description: string,
  details?: string
): ActivityLog => {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    description,
    performedBy: getCurrentUser(),
    performedAt: getCurrentTimestamp(),
    details
  };
};

/**
 * Log partner creation
 */
export const logPartnerCreated = (partnerName: string): ActivityLog => {
  return createAuditLog(
    'Create',
    `Partner "${partnerName}" created`
  );
};

/**
 * Log partner update
 */
export const logPartnerUpdated = (partnerName: string, changes: string[]): ActivityLog => {
  return createAuditLog(
    'Edit',
    `Partner "${partnerName}" updated`,
    `Changed fields: ${changes.join(', ')}`
  );
};

/**
 * Log status change
 */
export const logStatusChange = (
  partnerName: string,
  oldStatus: string,
  newStatus: string
): ActivityLog => {
  return createAuditLog(
    'Status Change',
    `Changed status from ${oldStatus} to ${newStatus} for partner "${partnerName}"`
  );
};

/**
 * Log partner deletion
 */
export const logPartnerDeleted = (partnerName: string, isSoft: boolean): ActivityLog => {
  return createAuditLog(
    'Delete',
    isSoft 
      ? `Partner "${partnerName}" archived (soft delete - has linked records)`
      : `Partner "${partnerName}" deleted`
  );
};

/**
 * Log document upload
 */
export const logDocumentUploaded = (
  partnerName: string,
  documentName: string
): ActivityLog => {
  return createAuditLog(
    'Document Upload',
    `Uploaded document "${documentName}" for partner "${partnerName}"`
  );
};

/**
 * Log note added
 */
export const logNoteAdded = (partnerName: string): ActivityLog => {
  return createAuditLog(
    'Note Added',
    `Added note to partner "${partnerName}"`
  );
};

/**
 * User roles for access control
 */
export enum UserRole {
  Admin = 'Admin',
  Accounting = 'Accounting',
  Sales = 'Sales',
  Operations = 'Operations',
  Viewer = 'Viewer'
}

/**
 * Check if user has permission to perform action
 */
export const hasPermission = (
  userRole: UserRole,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean => {
  const permissions: Record<UserRole, Set<string>> = {
    [UserRole.Admin]: new Set(['create', 'read', 'update', 'delete']),
    [UserRole.Accounting]: new Set(['create', 'read', 'update']),
    [UserRole.Sales]: new Set(['create', 'read', 'update']),
    [UserRole.Operations]: new Set(['read', 'update']),
    [UserRole.Viewer]: new Set(['read'])
  };

  return permissions[userRole]?.has(action) || false;
};

/**
 * Check if partner can be deleted
 * Partners with linked records should only be soft deleted (archived)
 */
export const canHardDelete = (partner: {
  linkedBookings?: unknown[];
  linkedQuotations?: unknown[];
  financialRecords?: unknown[];
}): boolean => {
  const hasLinkedRecords = 
    (partner.linkedBookings && partner.linkedBookings.length > 0) ||
    (partner.linkedQuotations && partner.linkedQuotations.length > 0) ||
    (partner.financialRecords && partner.financialRecords.length > 0);

  return !hasLinkedRecords;
};

/**
 * Validate partner can be assigned to new bookings
 */
export const canAssignToBooking = (partnerStatus: string): boolean => {
  // Blacklisted partners cannot be assigned to new bookings
  return partnerStatus !== 'Blacklisted';
};
