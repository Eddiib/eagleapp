import { Service } from '../types/service';

// Legacy mock data was built on the pre-MVP Service schema. The canonical
// services list now lives behind the API; this stub keeps legacy consumers
// (ServiceManagement) compiling without polluting them with stale records.
export const mockServices: Service[] = [];
