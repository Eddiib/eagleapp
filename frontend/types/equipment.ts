export interface EquipmentType {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  category: 'Container' | 'Trailer' | 'Chassis' | 'Vehicle' | 'Pallet' | 'Other';
  size?: string;
  specifications?: string;
  teuEquivalent?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  usedInBookings: number;
}

export type EquipmentFilters = {
  searchTerm: string;
  category: string;
};
