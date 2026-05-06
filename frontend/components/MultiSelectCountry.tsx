import { useState, useRef, useEffect } from 'react';
import { X, Search, Check, ChevronDown } from 'lucide-react';
import { countries, getCountryName } from '../data/countries';

interface MultiSelectCountryProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  label?: string;
  placeholder?: string;
  maxDisplay?: number;
}

export function MultiSelectCountry({
  selectedCountries = [],
  onChange,
  label = 'Select Countries',
  placeholder = 'Search and select countries...',
  maxDisplay = 5,
}: MultiSelectCountryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search term
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle country selection
  const toggleCountry = (countryCode: string) => {
    if (selectedCountries.includes(countryCode)) {
      onChange(selectedCountries.filter((c) => c !== countryCode));
    } else {
      onChange([...selectedCountries, countryCode]);
    }
  };

  // Remove a country from selection
  const removeCountry = (countryCode: string) => {
    onChange(selectedCountries.filter((c) => c !== countryCode));
  };

  // Clear all selections
  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Selected Countries Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex flex-wrap gap-1.5">
            {selectedCountries.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {placeholder}
              </span>
            ) : (
              <>
                {selectedCountries.slice(0, maxDisplay).map((countryCode) => (
                  <span
                    key={countryCode}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-sm"
                  >
                    {getCountryName(countryCode)}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCountry(countryCode);
                      }}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedCountries.length > maxDisplay && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm">
                    +{selectedCountries.length - maxDisplay} more
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedCountries.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Box */}
          <div className="sticky top-0 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {selectedCountries.length > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {selectedCountries.length} {selectedCountries.length === 1 ? 'country' : 'countries'} selected
              </div>
            )}
          </div>

          {/* Country List */}
          <div className="overflow-y-auto max-h-64">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No countries found
              </div>
            ) : (
              <div className="p-2">
                {filteredCountries.map((country) => {
                  const isSelected = selectedCountries.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => toggleCountry(country.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="flex-1 text-sm">{country.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {country.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with actions */}
          {selectedCountries.length > 0 && (
            <div className="sticky bottom-0 p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCountries.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
