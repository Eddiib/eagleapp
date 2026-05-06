import { api } from './client';
import { EquipmentType } from '../types/equipment';

function toEquipmentType(row: any): EquipmentType {
  return {
    id: row.id,
    equipmentCode: row.equipment_code,
    equipmentName: row.equipment_name,
    category: row.category,
    size: row.size,
    specifications: row.specifications,
    teuEquivalent: row.teu_equivalent != null ? Number(row.teu_equivalent) : undefined,
    isActive: row.is_active === 1 || row.is_active === true,
    notes: row.notes,
    usedInBookings: row.used_in_bookings ?? 0,
    createdAt: row.created_at ? String(row.created_at).split('T')[0] : '',
    createdBy: row.created_by ?? '',
    updatedAt: row.updated_at ? String(row.updated_at).split('T')[0] : '',
    updatedBy: row.updated_by ?? '',
  };
}

function toApiPayload(e: Partial<EquipmentType>, extra: Record<string, any> = {}) {
  return {
    equipment_code: e.equipmentCode,
    equipment_name: e.equipmentName,
    category: e.category,
    size: e.size,
    specifications: e.specifications,
    teu_equivalent: e.teuEquivalent ?? null,
    is_active: e.isActive,
    notes: e.notes,
    ...extra,
  };
}

export const equipmentApi = {
  getAll: async (): Promise<EquipmentType[]> => {
    const rows = await api.get<any[]>('/equipment');
    return rows.map(toEquipmentType);
  },
  getById: async (id: string): Promise<EquipmentType> => {
    const row = await api.get<any>(`/equipment/${id}`);
    return toEquipmentType(row);
  },
  create: (data: Partial<EquipmentType>, createdBy?: string) =>
    api.post<{ id: string }>('/equipment', toApiPayload(data, { created_by: createdBy })),
  update: (id: string, data: Partial<EquipmentType>, updatedBy?: string) =>
    api.put<{ message: string }>(`/equipment/${id}`, toApiPayload(data, { updated_by: updatedBy })),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/equipment/${id}`),
};
