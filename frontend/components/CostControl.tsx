import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Edit2,
  Plus,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Lock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { bookingsApi, Booking } from '../services/bookings';
import { CostEntry, costControlApi } from '../services/costControl';

export interface CostServiceLine {
  id: string;
  serviceIdentifier: string;
  serviceType: 'Container' | 'Truck' | 'Air' | 'Warehouse' | 'Customs' | 'Other';
  buyingInvoiceNumber: string;
  buyingInvoiceDate: string;
  buyingSupplier?: string;
  buyingPrice: number;
  buyingCurrency: string;
  buyingExchangeRate: number;
  buyingPriceEUR: number;
  sellingInvoiceNumber?: string;
  sellingInvoiceDate?: string;
  sellingPrice: number;
  sellingCurrency: string;
  sellingExchangeRate: number;
  sellingPriceEUR: number;
  accruedDate?: string;
  profitLoss: number;
  profitMargin: number;
  status?: 'complete' | 'missing-buying' | 'missing-selling' | 'no-invoices';
  isLocked: boolean;
  bookingReference?: string;
  billOfLading?: string;
  dateOfPurchase?: string;
  supplierName?: string;
  quantity?: number;
  clientName?: string;
  salesInvoiceNumber?: string;
  salesDate?: string;
  assignedSalesAgent?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface CostBooking {
  id: string;
  bookingReference: string;
  clientName: string;
  totalBuyingEUR: number;
  totalSellingEUR: number;
  totalProfitLoss: number;
  profitMargin: number;
  numberOfServices: number;
  salesAgent: string;
  status: 'balanced' | 'unbalanced' | 'draft';
  earliestAccruedDate: string;
  latestAccruedDate: string;
  hasIncompleteInvoices: boolean;
  services: CostServiceLine[];
}

interface CostControlProps {
  onAddEntry?: () => void;
  onEditEntry?: (entry: CostEntry) => void;
}

function inferServiceType(entry: CostEntry, booking?: Booking): CostServiceLine['serviceType'] {
  const label = `${entry.serviceName || ''} ${booking?.serviceType || ''}`.toLowerCase();
  if (label.includes('warehouse')) return 'Warehouse';
  if (label.includes('custom')) return 'Customs';
  if (booking?.serviceType === 'Air' || label.includes('air')) return 'Air';
  if (booking?.serviceType === 'Road' || label.includes('truck') || label.includes('road')) return 'Truck';
  if (label.includes('container') || booking?.serviceType === 'FCL' || booking?.serviceType === 'LCL') return 'Container';
  return 'Other';
}

function inferLineStatus(entry: CostEntry): CostServiceLine['status'] {
  if (!entry.invoiceNumber) return 'no-invoices';
  if (!entry.supplierId && !entry.supplierName) return 'missing-buying';
  if (entry.amount <= 0) return 'missing-buying';
  return 'complete';
}

function compareDate(a?: string, b?: string, mode: 'min' | 'max' = 'min'): string {
  if (!a) return b || '';
  if (!b) return a;
  return mode === 'min'
    ? (new Date(a) <= new Date(b) ? a : b)
    : (new Date(a) >= new Date(b) ? a : b);
}

function toLine(entry: CostEntry, booking?: Booking): CostServiceLine {
  const status = inferLineStatus(entry);
  const cost = entry.amount || 0;
  const buyingEUR = cost * (entry.buyingExchangeRate || 1);
  const sellingEUR = (entry.sellingPrice || 0) * (entry.sellingExchangeRate || 1);
  const profitLoss = sellingEUR - buyingEUR;

  return {
    id: entry.id,
    serviceIdentifier: entry.serviceName || entry.bookingNumber || entry.id.slice(0, 8),
    serviceType: inferServiceType(entry, booking),
    buyingInvoiceNumber: entry.invoiceNumber || '',
    buyingInvoiceDate: entry.invoiceDate || '',
    buyingSupplier: entry.supplierName,
    buyingPrice: cost,
    buyingCurrency: entry.currency,
    buyingExchangeRate: entry.buyingExchangeRate || 1,
    buyingPriceEUR: buyingEUR,
    sellingInvoiceNumber: entry.sellingInvoiceNumber || '',
    sellingInvoiceDate: entry.sellingInvoiceDate || '',
    sellingPrice: entry.sellingPrice || 0,
    sellingCurrency: entry.sellingCurrency || 'USD',
    sellingExchangeRate: entry.sellingExchangeRate || 1,
    sellingPriceEUR: sellingEUR,
    accruedDate: entry.invoiceDate || entry.dueDate || entry.createdAt,
    profitLoss,
    profitMargin: buyingEUR > 0 ? (profitLoss / buyingEUR) * 100 : 0,
    status,
    isLocked: entry.isLocked || entry.status === 'Paid',
    bookingReference: entry.bookingNumber,
    supplierName: entry.supplierName,
    clientName: entry.clientName || booking?.clientName,
    createdBy: entry.createdBy,
    createdAt: entry.createdAt,
    lastModifiedBy: entry.lastModifiedBy,
    lastModifiedAt: entry.lastModifiedAt,
  };
}

export function CostControl({ onAddEntry, onEditEntry }: CostControlProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [invoiceFilter, setInvoiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [costEntries, bookingRows] = await Promise.all([
        costControlApi.getAll(),
        bookingsApi.getAll(),
      ]);
      setEntries(costEntries);
      setBookings(bookingRows);
    } catch (err: any) {
      setError(err.message || 'Failed to load cost control');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const costBookings = useMemo(() => {
    const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
    const grouped = new Map<string, CostBooking>();

    entries.forEach((entry) => {
      const booking = entry.bookingId ? bookingMap.get(entry.bookingId) : undefined;
      const line = toLine(entry, booking);
      const groupId = entry.bookingId || entry.bookingNumber || `unassigned-${entry.id}`;

      const existing = grouped.get(groupId);
      if (!existing) {
        grouped.set(groupId, {
          id: groupId,
          bookingReference: entry.bookingNumber || booking?.bookingNumber || 'Unassigned',
          clientName: booking?.clientName || 'Unknown client',
          totalBuyingEUR: line.buyingPriceEUR,
          totalSellingEUR: line.sellingPriceEUR,
          totalProfitLoss: line.profitLoss,
          profitMargin: line.buyingPriceEUR > 0 ? (line.profitLoss / line.buyingPriceEUR) * 100 : 0,
          numberOfServices: 1,
          salesAgent: booking?.createdBy || entry.createdBy || 'Unassigned',
          status: line.status === 'complete' ? 'balanced' : 'unbalanced',
          earliestAccruedDate: line.accruedDate || '',
          latestAccruedDate: line.accruedDate || '',
          hasIncompleteInvoices: line.status !== 'complete',
          services: [line],
        });
        return;
      }

      existing.totalBuyingEUR += line.buyingPriceEUR;
      existing.totalSellingEUR += line.sellingPriceEUR;
      existing.totalProfitLoss += line.profitLoss;
      existing.numberOfServices += 1;
      existing.profitMargin = existing.totalBuyingEUR > 0
        ? (existing.totalProfitLoss / existing.totalBuyingEUR) * 100
        : 0;
      existing.status = existing.status === 'draft'
        ? 'draft'
        : (existing.status === 'balanced' && line.status === 'complete' ? 'balanced' : 'unbalanced');
      existing.hasIncompleteInvoices = existing.hasIncompleteInvoices || line.status !== 'complete';
      existing.earliestAccruedDate = compareDate(existing.earliestAccruedDate, line.accruedDate, 'min');
      existing.latestAccruedDate = compareDate(existing.latestAccruedDate, line.accruedDate, 'max');
      existing.services.push(line);
    });

    return Array.from(grouped.values()).sort((a, b) => a.bookingReference.localeCompare(b.bookingReference));
  }, [entries, bookings]);

  const filteredBookings = useMemo(() => {
    return costBookings.filter((booking) => {
      const matchesSearch =
        booking.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.salesAgent.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesInvoiceFilter =
        invoiceFilter === 'all' ||
        (invoiceFilter === 'incomplete' && booking.hasIncompleteInvoices) ||
        (invoiceFilter === 'missing-buying' && booking.services.some((service) => service.status === 'missing-buying' || service.status === 'no-invoices')) ||
        (invoiceFilter === 'missing-selling' && booking.totalSellingEUR === 0 && booking.services.length > 0);

      return matchesSearch && matchesStatus && matchesInvoiceFilter;
    });
  }, [costBookings, searchQuery, statusFilter, invoiceFilter]);

  const totalBuyingEUR = filteredBookings.reduce((sum, booking) => sum + booking.totalBuyingEUR, 0);
  const totalSellingEUR = filteredBookings.reduce((sum, booking) => sum + booking.totalSellingEUR, 0);
  const totalProfit = filteredBookings.reduce((sum, booking) => sum + booking.totalProfitLoss, 0);
  const bookingsWithIssues = filteredBookings.filter((booking) => booking.hasIncompleteInvoices).length;

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missing-buying':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'missing-selling':
      case 'no-invoices':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'balanced':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Balanced</Badge>;
      case 'unbalanced':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Unbalanced</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Draft</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading cost control...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Cost Control</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Live supplier-side costs grouped by booking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          {onAddEntry && (
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={onAddEntry}>
              <Plus className="w-4 h-4" />
              New Entry
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl text-gray-900 mt-1">{filteredBookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl text-gray-900 mt-1">
                €{totalBuyingEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl text-gray-900 mt-1">
                €{totalSellingEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className={`text-2xl mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {totalProfit >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by booking ref, client, or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="balanced">Balanced</option>
              <option value="unbalanced">Unbalanced</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={invoiceFilter}
              onChange={(e) => setInvoiceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Invoices</option>
              <option value="incomplete">Incomplete Invoices</option>
              <option value="missing-buying">Missing Buying</option>
              <option value="missing-selling">Missing Selling</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-600 w-10"></th>
                <th className="px-4 py-3 text-left text-xs text-gray-600">Booking Reference</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600">Client Name</th>
                <th className="px-4 py-3 text-right text-xs text-gray-600">Total Buying (EUR)</th>
                <th className="px-4 py-3 text-right text-xs text-gray-600">Total Selling (EUR)</th>
                <th className="px-4 py-3 text-right text-xs text-gray-600">Profit/Loss (EUR)</th>
                <th className="px-4 py-3 text-right text-xs text-gray-600">Margin %</th>
                <th className="px-4 py-3 text-center text-xs text-gray-600">Services</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600">Owner</th>
                <th className="px-4 py-3 text-left text-xs text-gray-600">Status</th>
                <th className="px-4 py-3 text-center text-xs text-gray-600">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => {
                const isExpanded = expandedBookings[booking.id];

                return (
                  <Fragment key={booking.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleBookingExpansion(booking.id)}>
                      <td className="px-4 py-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">{booking.bookingReference}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{booking.clientName}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        €{booking.totalBuyingEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        €{booking.totalSellingEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right ${booking.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{booking.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right ${booking.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {booking.profitMargin.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">{booking.numberOfServices}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{booking.salesAgent}</td>
                      <td className="px-4 py-3">{getBookingStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3 text-center">
                        {booking.hasIncompleteInvoices && <AlertTriangle className="w-4 h-4 text-yellow-600 mx-auto" />}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm text-gray-700">Service Level Details</h4>
                              <div className="text-xs text-gray-500">
                                Accrued Date Range: {booking.earliestAccruedDate || '—'} → {booking.latestAccruedDate || '—'}
                              </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs text-gray-600">Status</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-600">Service ID</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-600">Type</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-600">Buying Invoice</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-600">Supplier</th>
                                    <th className="px-3 py-2 text-right text-xs text-gray-600">Buying (EUR)</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-600">Selling Invoice</th>
                                    <th className="px-3 py-2 text-right text-xs text-gray-600">Selling (EUR)</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-600">Accrued Date</th>
                                    <th className="px-3 py-2 text-right text-xs text-gray-600">Profit (EUR)</th>
                                    <th className="px-3 py-2 text-center text-xs text-gray-600">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {booking.services.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-center">{getServiceStatusIcon(service.status || 'no-invoices')}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{service.serviceIdentifier}</td>
                                      <td className="px-3 py-2">
                                        <Badge variant="outline" className="text-xs">{service.serviceType}</Badge>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">
                                        {service.buyingInvoiceNumber || <span className="text-yellow-600 text-xs">Missing</span>}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">{service.buyingSupplier || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-right">
                                        <div className="text-gray-900">
                                          €{service.buyingPriceEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                        {service.buyingPrice > 0 && (
                                          <div className="text-xs text-gray-500">
                                            {service.buyingCurrency} {service.buyingPrice.toLocaleString()}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">
                                        {service.sellingInvoiceNumber || <span className="text-yellow-600 text-xs">Pending schema</span>}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-gray-900">
                                        €{service.sellingPriceEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-600">{service.accruedDate || '—'}</td>
                                      <td className={`px-3 py-2 text-sm text-right ${service.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        €{service.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center justify-center gap-1">
                                          {!service.isLocked && onEditEntry && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                const entry = entries.find((e) => e.id === service.id);
                                                if (entry) onEditEntry(entry);
                                              }}
                                            >
                                              <Edit2 className="w-3 h-3 text-gray-600" />
                                            </Button>
                                          )}
                                          {service.isLocked && <Lock className="w-3 h-3 text-orange-600" />}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                                  <tr>
                                    <td colSpan={5} className="px-3 py-2 text-sm text-gray-900">
                                      <strong>Booking Subtotal</strong>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-right text-gray-900">
                                      <strong>€{booking.totalBuyingEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                                    </td>
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 text-sm text-right text-gray-900">
                                      <strong>€{booking.totalSellingEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                                    </td>
                                    <td className="px-3 py-2"></td>
                                    <td className={`px-3 py-2 text-sm text-right ${booking.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      <strong>€{booking.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                                      <div className="text-xs">Margin: {booking.profitMargin.toFixed(2)}%</div>
                                    </td>
                                    <td className="px-3 py-2"></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No cost-control entries found</p>
          </div>
        )}
      </Card>

      {bookingsWithIssues > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          <AlertTriangle className="w-4 h-4" />
          {bookingsWithIssues} booking{bookingsWithIssues > 1 ? 's' : ''} contain incomplete supplier-side invoice data.
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredBookings.length} of {costBookings.length} bookings
        </div>
        <div className="flex items-center gap-6">
          <div>Total Cost: <span className="text-gray-900">€{totalBuyingEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
          <div>Total Revenue: <span className="text-gray-900">€{totalSellingEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
          <div>Total Profit: <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
            €{totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span></div>
        </div>
      </div>
    </div>
  );
}
