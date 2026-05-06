// Global list of countries for trade lanes and partner management
export interface Country {
  code: string; // ISO 2-letter code
  name: string;
  region: string; // For future regional grouping
}

export const countries: Country[] = [
  // Europe
  { code: 'AL', name: 'Albania', region: 'Europe' },
  { code: 'AT', name: 'Austria', region: 'Europe' },
  { code: 'BE', name: 'Belgium', region: 'Europe' },
  { code: 'BG', name: 'Bulgaria', region: 'Europe' },
  { code: 'HR', name: 'Croatia', region: 'Europe' },
  { code: 'CY', name: 'Cyprus', region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe' },
  { code: 'DK', name: 'Denmark', region: 'Europe' },
  { code: 'EE', name: 'Estonia', region: 'Europe' },
  { code: 'FI', name: 'Finland', region: 'Europe' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'GR', name: 'Greece', region: 'Europe' },
  { code: 'HU', name: 'Hungary', region: 'Europe' },
  { code: 'IE', name: 'Ireland', region: 'Europe' },
  { code: 'IT', name: 'Italy', region: 'Europe' },
  { code: 'XK', name: 'Kosovo', region: 'Europe' },
  { code: 'LV', name: 'Latvia', region: 'Europe' },
  { code: 'LT', name: 'Lithuania', region: 'Europe' },
  { code: 'LU', name: 'Luxembourg', region: 'Europe' },
  { code: 'MT', name: 'Malta', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'MK', name: 'North Macedonia', region: 'Europe' },
  { code: 'NO', name: 'Norway', region: 'Europe' },
  { code: 'PL', name: 'Poland', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  { code: 'RO', name: 'Romania', region: 'Europe' },
  { code: 'RS', name: 'Serbia', region: 'Europe' },
  { code: 'SK', name: 'Slovakia', region: 'Europe' },
  { code: 'SI', name: 'Slovenia', region: 'Europe' },
  { code: 'ES', name: 'Spain', region: 'Europe' },
  { code: 'SE', name: 'Sweden', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', region: 'Europe' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe' },
  
  // Asia (Far East)
  { code: 'CN', name: 'China', region: 'Far East' },
  { code: 'HK', name: 'Hong Kong', region: 'Far East' },
  { code: 'JP', name: 'Japan', region: 'Far East' },
  { code: 'KR', name: 'South Korea', region: 'Far East' },
  { code: 'TW', name: 'Taiwan', region: 'Far East' },
  { code: 'VN', name: 'Vietnam', region: 'Far East' },
  { code: 'TH', name: 'Thailand', region: 'Far East' },
  { code: 'SG', name: 'Singapore', region: 'Far East' },
  { code: 'MY', name: 'Malaysia', region: 'Far East' },
  { code: 'ID', name: 'Indonesia', region: 'Far East' },
  { code: 'PH', name: 'Philippines', region: 'Far East' },
  
  // Asia (Middle East & Indian Subcontinent)
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East' },
  { code: 'QA', name: 'Qatar', region: 'Middle East' },
  { code: 'KW', name: 'Kuwait', region: 'Middle East' },
  { code: 'BH', name: 'Bahrain', region: 'Middle East' },
  { code: 'OM', name: 'Oman', region: 'Middle East' },
  { code: 'JO', name: 'Jordan', region: 'Middle East' },
  { code: 'LB', name: 'Lebanon', region: 'Middle East' },
  { code: 'IL', name: 'Israel', region: 'Middle East' },
  { code: 'TR', name: 'Turkey', region: 'Middle East' },
  { code: 'IR', name: 'Iran', region: 'Middle East' },
  { code: 'IQ', name: 'Iraq', region: 'Middle East' },
  { code: 'IN', name: 'India', region: 'Indian Subcontinent' },
  { code: 'PK', name: 'Pakistan', region: 'Indian Subcontinent' },
  { code: 'BD', name: 'Bangladesh', region: 'Indian Subcontinent' },
  { code: 'LK', name: 'Sri Lanka', region: 'Indian Subcontinent' },
  
  // Americas
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'MX', name: 'Mexico', region: 'North America' },
  { code: 'BR', name: 'Brazil', region: 'South America' },
  { code: 'AR', name: 'Argentina', region: 'South America' },
  { code: 'CL', name: 'Chile', region: 'South America' },
  { code: 'CO', name: 'Colombia', region: 'South America' },
  { code: 'PE', name: 'Peru', region: 'South America' },
  
  // Africa
  { code: 'EG', name: 'Egypt', region: 'Africa' },
  { code: 'ZA', name: 'South Africa', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', region: 'Africa' },
  { code: 'KE', name: 'Kenya', region: 'Africa' },
  { code: 'MA', name: 'Morocco', region: 'Africa' },
  { code: 'TN', name: 'Tunisia', region: 'Africa' },
  { code: 'DZ', name: 'Algeria', region: 'Africa' },
  
  // Oceania
  { code: 'AU', name: 'Australia', region: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania' },
];

// Helper function to get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

// Helper function to get country name by code
export const getCountryName = (code: string): string => {
  const country = getCountryByCode(code);
  return country ? country.name : code;
};

// Helper function to get countries by region
export const getCountriesByRegion = (region: string): Country[] => {
  return countries.filter(c => c.region === region);
};

// Get all unique regions
export const getRegions = (): string[] => {
  return Array.from(new Set(countries.map(c => c.region)));
};

// Future: Trade lane structure (for future use)
export interface TradeLane {
  origin: string; // Country code
  destination: string; // Country code
}

// Future: Trade lane pair (for future matching logic)
export interface TradeLanePair {
  from: string; // Country code or region
  to: string; // Country code or region
  type: 'country' | 'region';
}
