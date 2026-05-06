import { ServiceManagement } from './ServiceManagement';

// Legacy compatibility wrapper. The live service workflow is now centralized in
// ServiceManagement so older imports cannot drift onto a mock-only implementation.
export function Services() {
  return <ServiceManagement />;
}
