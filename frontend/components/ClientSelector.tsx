import { useState, useEffect } from 'react';
import { Partner } from '../types/partner';
import { usePartners } from '../hooks/usePartners';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Building2, MapPin, Info } from 'lucide-react';
import { getCountryName } from '../data/countries';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Button } from './ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface ClientSelectorProps {
  selectedPartnerId?: string;
  onSelect: (partnerId: string, partner: Partner | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}


export function ClientSelector({
  selectedPartnerId,
  onSelect,
  label = 'Client / Company Name',
  required = false,
  disabled = false,
  error
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const { partners: allPartners } = usePartners();
  const clients = allPartners.filter(
    p => (p.partnerType === 'Client' || p.partnerType === 'Buyer') && p.status === 'Active'
  );
  const [selectedClient, setSelectedClient] = useState<Partner | null>(null);

  useEffect(() => {
    if (selectedPartnerId) {
      const client = clients.find(p => p.id === selectedPartnerId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [selectedPartnerId, clients]);

  const handleSelect = (partnerId: string) => {
    const client = clients.find(p => p.id === partnerId);
    onSelect(partnerId, client || null);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Clients must be selected from the Partners list. Only Partners with type "Client" or "Buyer" are available.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${error ? 'border-red-500' : ''}`}
            disabled={disabled}
          >
            {selectedClient ? (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>{selectedClient.tradingName}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">{getCountryName(selectedClient.country)}</span>
              </div>
            ) : (
              <span className="text-gray-500">Select client from Partners...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandEmpty>
              <div className="p-4 text-center">
                <p className="text-gray-600 mb-2">No clients found</p>
                <p className="text-sm text-gray-500">
                  Clients must be added in the Partners module first
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.tradingName} ${client.companyLegalName} ${client.partnerCode} ${getCountryName(client.country)}`}
                  onSelect={() => handleSelect(client.id)}
                  className="flex items-center gap-3 py-3"
                >
                  <Check
                    className={`w-4 h-4 ${
                      selectedPartnerId === client.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{client.tradingName}</span>
                      <span className="text-gray-500">•</span>
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{getCountryName(client.country)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {client.partnerCode}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {client.partnerType}
                      </Badge>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Client Details */}
      {selectedClient && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Partner Code:</span>{' '}
              <span className="text-gray-900 dark:text-white">{selectedClient.partnerCode}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Type:</span>{' '}
              <span className="text-gray-900 dark:text-white">{selectedClient.partnerType}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Country:</span>{' '}
              <span className="text-gray-900 dark:text-white">{getCountryName(selectedClient.country)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">City:</span>{' '}
              <span className="text-gray-900 dark:text-white">{selectedClient.city}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Payment Terms:</span>{' '}
              <span className="text-gray-900 dark:text-white">{selectedClient.paymentTerms}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Currency:</span>{' '}
              <span className="text-gray-900 dark:text-white">{selectedClient.currency}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
