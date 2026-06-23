import { useState, useMemo } from 'react';
import { Partner } from '../types/partner';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from './ui/utils';
import { getCountryName } from '../data/countries';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Button } from './ui/button';
import { usePartners, getCarriers } from '../hooks/usePartners';

interface CarrierSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'default' | 'sm';
}

export function CarrierSelect({
  value,
  onChange,
  placeholder = 'Select carrier...',
  className,
  disabled = false,
  size = 'default'
}: CarrierSelectProps) {
  const [open, setOpen] = useState(false);

  // Get all partners from shared data source
  const { partners: allPartners } = usePartners();

  // Filter partners to only include those with partnerType = 'Carrier' and active status
  const carriers = useMemo(() => {
    return allPartners.filter(
      (partner) =>
        partner.partnerClass === 'Carrier' &&
        partner.status === 'Active'
    );
  }, [allPartners]);

  // Find selected carrier
  const selectedCarrier = carriers.find((carrier) => carrier.tradingName === value);

  const buttonSizeClasses = size === 'sm' 
    ? 'h-7 text-xs px-2' 
    : 'h-9 text-sm px-3';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            buttonSizeClasses,
            !value && 'text-gray-500 dark:text-gray-400',
            className
          )}
        >
          {selectedCarrier ? (
            <span className="truncate">{selectedCarrier.tradingName}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
          <ChevronsUpDown className={cn('ml-2 flex-shrink-0 opacity-50', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Search carriers..." 
              className="h-9 border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No carriers found
              </div>
            </CommandEmpty>
            <CommandGroup heading="Carriers only (from Partners List)">
              {carriers.map((carrier) => (
                <CommandItem
                  key={carrier.id}
                  value={carrier.tradingName}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          value === carrier.tradingName ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {carrier.tradingName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {carrier.partnerCode} • {getCountryName(carrier.country)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {carrier.partnerCategory === 'Shipping Line' && 'Sea'}
                        {carrier.partnerCategory === 'Air Carrier' && 'Air'}
                        {carrier.partnerCategory === 'Trucking Company' && 'Road'}
                        {carrier.partnerCategory === 'Rail Operator' && 'Rail'}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}