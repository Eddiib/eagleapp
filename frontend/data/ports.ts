// Common UN/LOCODE port codes for freight forwarding
import { getCountryName } from './countries';

export interface Port {
  code: string;
  name: string;
  country: string; // ISO 2-letter country code
}

export const ports: Port[] = [
  // Major European Ports
  { code: 'NLRTM', name: 'Rotterdam', country: 'NL' },
  { code: 'BEANR', name: 'Antwerp', country: 'BE' },
  { code: 'DEHAM', name: 'Hamburg', country: 'DE' },
  { code: 'ESVLC', name: 'Valencia', country: 'ES' },
  { code: 'ITGOA', name: 'Genoa', country: 'IT' },
  { code: 'GRPIR', name: 'Piraeus', country: 'GR' },
  { code: 'ALDRZ', name: 'Durres', country: 'AL' },
  { code: 'FRLEH', name: 'Le Havre', country: 'FR' },
  { code: 'GBFXT', name: 'Felixstowe', country: 'GB' },
  { code: 'GBLGP', name: 'London Gateway', country: 'GB' },

  // Mediterranean Ports
  { code: 'TRIST', name: 'Istanbul', country: 'TR' },
  { code: 'EGALY', name: 'Alexandria', country: 'EG' },
  { code: 'MAPTM', name: 'Tanger Med', country: 'MA' },
  { code: 'ITSAL', name: 'Salerno', country: 'IT' },
  { code: 'ITNAP', name: 'Naples', country: 'IT' },

  // Asian Ports
  { code: 'CNSGH', name: 'Shanghai', country: 'CN' },
  { code: 'CNSHK', name: 'Shekou', country: 'CN' },
  { code: 'CNNGB', name: 'Ningbo', country: 'CN' },
  { code: 'CNQIN', name: 'Qingdao', country: 'CN' },
  { code: 'CNYTN', name: 'Yantian', country: 'CN' },
  { code: 'SGSIN', name: 'Singapore', country: 'SG' },
  { code: 'HKHKG', name: 'Hong Kong', country: 'HK' },
  { code: 'KRPUS', name: 'Busan', country: 'KR' },
  { code: 'JPUKB', name: 'Kobe', country: 'JP' },
  { code: 'JPTYO', name: 'Tokyo', country: 'JP' },
  { code: 'THBKK', name: 'Bangkok', country: 'TH' },
  { code: 'VNSGN', name: 'Ho Chi Minh', country: 'VN' },
  { code: 'INVTZ', name: 'Visakhapatnam', country: 'IN' },
  { code: 'INMUN', name: 'Mumbai', country: 'IN' },

  // Middle East Ports
  { code: 'AEJEA', name: 'Jebel Ali', country: 'AE' },
  { code: 'AEDXB', name: 'Dubai', country: 'AE' },
  { code: 'SAJED', name: 'Jeddah', country: 'SA' },
  { code: 'OMSAL', name: 'Salalah', country: 'OM' },

  // North American Ports
  { code: 'USLAX', name: 'Los Angeles', country: 'US' },
  { code: 'USLGB', name: 'Long Beach', country: 'US' },
  { code: 'USNYC', name: 'New York', country: 'US' },
  { code: 'USORF', name: 'Norfolk', country: 'US' },
  { code: 'USSEA', name: 'Seattle', country: 'US' },
  { code: 'CAVAN', name: 'Vancouver', country: 'CA' },
  { code: 'CAMTR', name: 'Montreal', country: 'CA' },

  // South American Ports
  { code: 'BRSST', name: 'Santos', country: 'BR' },
  { code: 'ARBUE', name: 'Buenos Aires', country: 'AR' },
  { code: 'CLSAI', name: 'San Antonio', country: 'CL' },

  // African Ports
  { code: 'ZADUR', name: 'Durban', country: 'ZA' },
  { code: 'EGPSD', name: 'Port Said', country: 'EG' },
  { code: 'MAMBA', name: 'Casablanca', country: 'MA' },

  // Adriatic Ports
  { code: 'HRRJK', name: 'Rijeka', country: 'HR' },
  { code: 'SIKOP', name: 'Koper', country: 'SI' },
  { code: 'ITTRZ', name: 'Trieste', country: 'IT' },
  { code: 'ITVEN', name: 'Venice', country: 'IT' },
  { code: 'MEBRV', name: 'Bar', country: 'ME' },
];

export function getPortName(code: string): string {
  const port = ports.find(p => p.code === code);
  return port ? `${port.name} (${code})` : code;
}

export function searchPorts(query: string): Port[] {
  const searchTerm = query.toLowerCase();
  return ports.filter(port =>
    port.code.toLowerCase().includes(searchTerm) ||
    port.name.toLowerCase().includes(searchTerm) ||
    port.country.toLowerCase().includes(searchTerm) ||
    getCountryName(port.country).toLowerCase().includes(searchTerm)
  );
}
