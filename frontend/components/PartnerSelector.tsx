import { useState, useEffect } from 'react';
import { Partner, PartnerType } from '../types/partner';
import { usePartners } from '../hooks/usePartners';
import { getCountryName } from '../data/countries';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { validatePartnerForService } from '../utils/partnerLinking';

interface PartnerSelectorProps {
  partnerType: PartnerType;
  serviceType?: 'Sea' | 'Air' | 'Road' | 'Rail';
  selectedPartnerId?: string;
  onSelect: (partnerId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}


export function PartnerSelector({
  partnerType,
  serviceType,
  selectedPartnerId,
  onSelect,
  label,
  required = false,
  disabled = false
}: PartnerSelectorProps) {
  const { partners: allPartners } = usePartners();
  const partners = allPartners.filter(p => p.partnerType === partnerType);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; reason?: string } | null>(null);

  useEffect(() => {
    if (selectedPartnerId) {
      const partner = partners.find(p => p.id === selectedPartnerId);
      setSelectedPartner(partner || null);
      
      // Validate if service type is provided
      if (partner && serviceType) {
        const validationResult = validatePartnerForService(partner, serviceType);
        setValidation(validationResult);
      }
    } else {
      setSelectedPartner(null);
      setValidation(null);
    }
  }, [selectedPartnerId, partners, serviceType]);

  const handleSelect = (value: string) => {
    onSelect(value);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <Select
        value={selectedPartnerId}
        onValueChange={handleSelect}
        disabled={disabled || partners.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${partnerType}...`} />
        </SelectTrigger>
        <SelectContent>
          {partners.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No active {partnerType.toLowerCase()}s available
            </div>
          ) : (
            partners
              .filter(p => p.status === 'Active') // Only show active partners
              .map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2">
                      <span>{partner.tradingName}</span>
                      <span className="text-gray-500 dark:text-gray-400">({partner.partnerCode})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(partner.rating)}
                      <Badge variant="outline" className="text-xs">
                        {partner.defaultServiceType}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))
          )}
        </SelectContent>
      </Select>

      {/* Partner Details */}
      {selectedPartner && (
        <div className="p-3 bg-gray-50 dark:bg-[#262626] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Country:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{getCountryName(selectedPartner.country)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Payment Terms:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{selectedPartner.paymentTerms}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Rating:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{renderStars(selectedPartner.rating)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Service:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{selectedPartner.defaultServiceType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {validation && !validation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validation.reason}</AlertDescription>
        </Alert>
      )}

      {validation && validation.valid && validation.reason && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validation.reason}</AlertDescription>
        </Alert>
      )}

      {validation && validation.valid && !validation.reason && selectedPartner && (
        <Alert className="border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            Partner validated for {serviceType} service
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
