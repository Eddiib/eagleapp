import { useState, useMemo, useEffect } from 'react';
import { bookingsApi, Booking } from '../services/bookings';
import { invoicesApi } from '../services/invoices';
import { exchangeRatesApi, ExchangeRateRow } from '../services/exchangeRates';
import { sumToBase, formatCurrency } from '../lib/fx';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { 
  Plus, 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Ship, 
  Plane, 
  Truck, 
  Train,
  Package,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Eye
} from 'lucide-react';
import { Card } from './ui/card';
import { getCountryName } from '../data/countries';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Extended Booking Interface with Financial Data
export interface DashboardBooking {
  id: string;
  bookingReference: string;
  clientName: string;
  origin: string;
  destination: string;
  mode: 'FCL' | 'LCL' | 'FTL' | 'LTL' | 'Air' | 'Rail' | 'Parcel';
  serviceIdentifier: string; // Container No / Truck Plate / AWB
  equipmentType?: string;
  etd: string;
  eta: string;
  status: 'Open' | 'Departed' | 'In Transit' | 'Arrived' | 'Delivered';
  salesAgent: string;
  buyingPrice: number;
  sellingPrice: number;
  profitEUR: number;
  profitMargin: number;
  bookingDate: string;
  currency: string;
  hasDocuments: boolean;
  hasInvoices: boolean;
  hasSupplier: boolean;
  vesselFlightNumber?: string;
  isDelayed?: boolean;
}

interface DashboardProps {
  onNewBooking?: () => void;
  onViewAllBookings?: () => void;
  onViewBooking?: (booking: DashboardBooking) => void;
}

// Chart Colors
const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

function mapBookingMode(serviceType: string): DashboardBooking['mode'] {
  switch (serviceType) {
    case 'Air':  return 'Air';
    case 'Road': return 'FTL';
    case 'LCL':  return 'LCL';
    default:     return 'FCL';
  }
}

function mapBookingStatus(status: string): DashboardBooking['status'] {
  switch (status) {
    case 'Confirmed':  return 'Departed';
    case 'In Transit': return 'In Transit';
    case 'Delivered':  return 'Delivered';
    default:           return 'Open';
  }
}

function bookingToDashboard(b: Booking, invoicedBookingIds: Set<string>): DashboardBooking {
  const cost = b.totalCost || 0;
  const sell = b.totalRevenue || 0;
  const profit = sell - cost;
  const margin = cost > 0 ? (profit / cost) * 100 : 0;
  const today = new Date();
  const etaDate = b.estimatedArrival ? new Date(b.estimatedArrival) : null;
  const isDelayed = etaDate ? etaDate < today && b.status !== 'Delivered' && b.status !== 'Cancelled' : false;
  const firstEq = b.equipment?.[0];
  return {
    id: b.id,
    bookingReference: b.bookingNumber,
    clientName: b.clientName || 'Unknown',
    origin: [b.originCountry ? getCountryName(b.originCountry) : '', b.originPort].filter(Boolean).join(', ') || '',
    destination: [b.destinationCountry ? getCountryName(b.destinationCountry) : '', b.destinationPort].filter(Boolean).join(', ') || '',
    mode: mapBookingMode(b.serviceType),
    serviceIdentifier: firstEq?.containerId || b.masterBl || b.bookingNumber,
    equipmentType: firstEq?.typeSize || firstEq?.equipmentCode || undefined,
    etd: b.estimatedDeparture || '',
    eta: b.estimatedArrival || '',
    status: mapBookingStatus(b.status),
    salesAgent: b.createdBy || 'Unassigned',
    buyingPrice: cost,
    sellingPrice: sell,
    profitEUR: profit,
    profitMargin: margin,
    bookingDate: b.bookingDate || '',
    currency: b.currency || 'USD',
    hasDocuments: (b.attachments?.length ?? 0) > 0,
    hasInvoices: invoicedBookingIds.has(b.id),
    hasSupplier: !!b.carrierId,
    vesselFlightNumber: b.masterBl || b.carrierRef || undefined,
    isDelayed,
  };
}

export function Dashboard({ onNewBooking, onViewAllBookings, onViewBooking }: DashboardProps) {
  const { baseCurrency: BASE_CURRENCY } = useCompanySettings();
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);

  useEffect(() => {
    Promise.all([
      bookingsApi.getAll(),
      invoicesApi.getAll().catch(() => []),
      exchangeRatesApi.getAll().catch(() => [] as ExchangeRateRow[]),
    ])
      .then(([bookingRows, invoiceRows, rateRows]) => {
        const invoicedBookingIds = new Set<string>();
        for (const inv of invoiceRows) {
          if (inv.invoiceType === 'Sales' && inv.bookingId && inv.status !== 'Cancelled' && inv.status !== 'Void') {
            invoicedBookingIds.add(inv.bookingId);
          }
        }
        setBookings(bookingRows.map(b => bookingToDashboard(b, invoicedBookingIds)));
        setRates(rateRows);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoadingData(false));
  }, []);
  
  // Filter States
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter'>('month');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get current month for filtering
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filtered Bookings based on all filters
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Date Range Filter
      if (dateRange === 'month') {
        const bookingMonth = new Date(booking.bookingDate).getMonth() + 1;
        const bookingYear = new Date(booking.bookingDate).getFullYear();
        if (bookingMonth !== currentMonth || bookingYear !== currentYear) return false;
      }

      // Mode Filter
      if (modeFilter !== 'all' && booking.mode !== modeFilter) return false;

      // Client Filter
      if (clientFilter !== 'all' && booking.clientName !== clientFilter) return false;

      // Agent Filter
      if (agentFilter !== 'all' && booking.salesAgent !== agentFilter) return false;

      // Status Filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;

      return true;
    });
  }, [bookings, dateRange, modeFilter, clientFilter, agentFilter, statusFilter, currentMonth, currentYear]);

  // Previous month data for comparison (mock - in production would come from historical data)
  const previousMonthBookings = bookings.filter(b => {
    const bookingMonth = new Date(b.bookingDate).getMonth() + 1;
    return bookingMonth === currentMonth - 1;
  });

  // KPI Calculations
  const kpis = useMemo(() => {
    const currentData = dateRange === 'month' 
      ? filteredBookings.filter(b => {
          const bookingMonth = new Date(b.bookingDate).getMonth() + 1;
          return bookingMonth === currentMonth;
        })
      : filteredBookings;

    const totalBookings = currentData.length;
    const prevBookings = previousMonthBookings.length;
    const bookingsChange = prevBookings > 0 ? ((totalBookings - prevBookings) / prevBookings) * 100 : 0;

    // Count containers/trucks/shipments
    const containers = currentData.filter(b => b.mode === 'FCL' || b.mode === 'LCL').length;
    const trucks = currentData.filter(b => b.mode === 'FTL' || b.mode === 'LTL').length;
    const airShipments = currentData.filter(b => b.mode === 'Air').length;

    // On-Time vs Late
    const onTime = currentData.filter(b => !b.isDelayed).length;
    const late = currentData.filter(b => b.isDelayed).length;
    const onTimePercentage = totalBookings > 0 ? (onTime / totalBookings) * 100 : 0;

    // Financial Metrics — normalize mixed currencies to the base currency via FX rates.
    const revenueFx = sumToBase(
      currentData.map(b => ({ amount: b.sellingPrice, currency: b.currency, asOfDate: b.bookingDate })),
      BASE_CURRENCY, rates,
    );
    const costFx = sumToBase(
      currentData.map(b => ({ amount: b.buyingPrice, currency: b.currency, asOfDate: b.bookingDate })),
      BASE_CURRENCY, rates,
    );
    const totalRevenue = revenueFx.total;
    const totalCost    = costFx.total;
    const totalProfit  = totalRevenue - totalCost;
    const missingRates = Array.from(new Set([...revenueFx.missing, ...costFx.missing]));

    const prevRevenueFx = sumToBase(
      previousMonthBookings.map(b => ({ amount: b.sellingPrice, currency: b.currency, asOfDate: b.bookingDate })),
      BASE_CURRENCY, rates,
    );
    const prevCostFx = sumToBase(
      previousMonthBookings.map(b => ({ amount: b.buyingPrice, currency: b.currency, asOfDate: b.bookingDate })),
      BASE_CURRENCY, rates,
    );
    const prevRevenue = prevRevenueFx.total;
    const prevProfit  = prevRevenueFx.total - prevCostFx.total;
    
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const profitChange = prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit) * 100 : 0;

    // Best Performing Agent — profit normalized to base currency.
    const agentStats = currentData.reduce((acc, booking) => {
      if (!acc[booking.salesAgent]) {
        acc[booking.salesAgent] = { count: 0, profit: 0 };
      }
      acc[booking.salesAgent].count++;
      const revFx = sumToBase([{ amount: booking.sellingPrice, currency: booking.currency, asOfDate: booking.bookingDate }], BASE_CURRENCY, rates);
      const cstFx = sumToBase([{ amount: booking.buyingPrice,  currency: booking.currency, asOfDate: booking.bookingDate }], BASE_CURRENCY, rates);
      acc[booking.salesAgent].profit += (revFx.total - cstFx.total);
      return acc;
    }, {} as Record<string, { count: number; profit: number }>);

    const bestAgent = Object.entries(agentStats).sort((a, b) => b[1].profit - a[1].profit)[0];

    return {
      totalBookings,
      bookingsChange,
      containers,
      trucks,
      airShipments,
      onTime,
      late,
      onTimePercentage,
      totalRevenue,
      totalCost,
      totalProfit,
      revenueChange,
      profitChange,
      missingRates,
      bestAgent: bestAgent ? { name: bestAgent[0], profit: bestAgent[1].profit } : null
    };
  }, [filteredBookings, currentMonth, previousMonthBookings, dateRange, rates, BASE_CURRENCY]);

  // Chart Data Calculations
  const modeChartData = useMemo(() => {
    const modeCounts = filteredBookings.reduce((acc, booking) => {
      acc[booking.mode] = (acc[booking.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(modeCounts).map(([name, value]) => ({ name, value }));
  }, [filteredBookings]);

  const tradeLaneData = useMemo(() => {
    const lanes = filteredBookings.reduce((acc, booking) => {
      const lane = `${booking.origin.split(',')[1]?.trim() || booking.origin} → ${booking.destination.split(',')[1]?.trim() || booking.destination}`;
      acc[lane] = (acc[lane] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(lanes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lane, bookings]) => ({ lane, bookings }));
  }, [filteredBookings]);

  const profitByBookingData = useMemo(() => {
    return filteredBookings
      .sort((a, b) => b.profitEUR - a.profitEUR)
      .slice(0, 10)
      .map(b => ({ 
        booking: b.bookingReference, 
        profit: b.profitEUR 
      }));
  }, [filteredBookings]);

  const agentBookingsData = useMemo(() => {
    const agentCounts = filteredBookings.reduce((acc, booking) => {
      acc[booking.salesAgent] = (acc[booking.salesAgent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(agentCounts).map(([agent, count]) => ({ agent, count }));
  }, [filteredBookings]);

  const monthlyTrendData = useMemo(() => {
    // Group bookings by month
    const monthlyData = bookings.reduce((acc, booking) => {
      const date = new Date(booking.bookingDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { bookings: 0, profit: 0 };
      }
      acc[monthKey].bookings++;
      acc[monthKey].profit += booking.profitEUR;
      
      return acc;
    }, {} as Record<string, { bookings: number; profit: number }>);

    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        bookings: data.bookings,
        profit: Math.round(data.profit)
      }));
  }, [bookings]);

  // Tables Data
  const recentBookings = useMemo(() => {
    return filteredBookings
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
      .slice(0, 5);
  }, [filteredBookings]);

  const attentionRequired = useMemo(() => {
    return filteredBookings.filter(b => 
      !b.hasDocuments || !b.hasInvoices || !b.hasSupplier || b.isDelayed
    );
  }, [filteredBookings]);

  const upcomingShipments = useMemo(() => {
    return filteredBookings
      .filter(b => b.status === 'Open' || b.status === 'Departed')
      .sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime())
      .slice(0, 5);
  }, [filteredBookings]);

  // Get unique values for filters
  const uniqueClients = Array.from(new Set(bookings.map(b => b.clientName))).sort();
  const uniqueAgents = Array.from(new Set(bookings.map(b => b.salesAgent))).sort();

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'FCL':
      case 'LCL':
        return <Ship className="w-4 h-4" />;
      case 'Air':
        return <Plane className="w-4 h-4" />;
      case 'FTL':
      case 'LTL':
        return <Truck className="w-4 h-4" />;
      case 'Rail':
        return <Train className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Open': 'outline',
      'Departed': 'secondary',
      'In Transit': 'default',
      'Arrived': 'secondary',
      'Delivered': 'default'
    };
    
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100 mb-1">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-Time Insights from Booking Details
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onViewAllBookings}
              className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              View All Bookings
            </Button>
            <Button 
              variant="outline"
              className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Dashboard
            </Button>
            <Button 
              onClick={onNewBooking}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {kpis.missingRates.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Totals exclude bookings priced in {kpis.missingRates.join(', ')} — no FX rate to {BASE_CURRENCY} configured.
            Add rates under Settings → Exchange Rates to include them.
          </span>
        </div>
      )}

      {/* Filters Section */}
      <Card className="p-4 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Filters:</span>
          </div>
          
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>

          <select 
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Modes</option>
            <option value="FCL">FCL</option>
            <option value="LCL">LCL</option>
            <option value="FTL">FTL</option>
            <option value="LTL">LTL</option>
            <option value="Air">Air</option>
            <option value="Rail">Rail</option>
          </select>

          <select 
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Clients</option>
            {uniqueClients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>

          <select 
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Departed">Departed</option>
            <option value="In Transit">In Transit</option>
            <option value="Arrived">Arrived</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </Card>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {/* Total Bookings */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
              <p className="text-2xl text-gray-900 dark:text-gray-100 mb-1">{kpis.totalBookings}</p>
              <div className="flex items-center gap-1 text-xs">
                {kpis.bookingsChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={kpis.bookingsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(kpis.bookingsChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        {/* Shipment Types */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Containers/Units</p>
              <p className="text-2xl text-gray-900 dark:text-gray-100 mb-1">
                {kpis.containers + kpis.trucks + kpis.airShipments}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>{kpis.containers} FCL/LCL</span>
                <span>•</span>
                <span>{kpis.trucks} Trucks</span>
                <span>•</span>
                <span>{kpis.airShipments} Air</span>
              </div>
            </div>
            <Ship className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        {/* On-Time Performance */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">On-Time Rate</p>
              <p className="text-2xl text-gray-900 dark:text-gray-100 mb-1">
                {kpis.onTimePercentage.toFixed(0)}%
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="text-green-600">{kpis.onTime} On-Time</span>
                <span>•</span>
                <span className="text-red-600">{kpis.late} Late</span>
              </div>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-2xl text-gray-900 dark:text-gray-100 mb-1">
                {formatCurrency(kpis.totalRevenue, BASE_CURRENCY)}
              </p>
              <div className="flex items-center gap-1 text-xs">
                {kpis.revenueChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={kpis.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(kpis.revenueChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        {/* Total Profit */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Profit</p>
              <p className="text-2xl text-gray-900 dark:text-gray-100 mb-1">
                {formatCurrency(kpis.totalProfit, BASE_CURRENCY)}
              </p>
              <div className="flex items-center gap-1 text-xs">
                {kpis.profitChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={kpis.profitChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(kpis.profitChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        {/* Best Agent */}
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top Agent</p>
              <p className="text-lg text-gray-900 dark:text-gray-100 mb-1 truncate">
                {kpis.bestAgent?.name || 'N/A'}
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {kpis.bestAgent ? formatCurrency(kpis.bestAgent.profit, BASE_CURRENCY) : formatCurrency(0, BASE_CURRENCY)} profit
              </div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bookings by Mode */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-gray-100 mb-4">Bookings by Mode of Transport</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={modeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {modeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bookings by Trade Lane */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-gray-100 mb-4">Top Trade Lanes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tradeLaneData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="lane" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Profit by Booking */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-gray-100 mb-4">Top 10 Bookings by Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitByBookingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="booking" type="category" width={80} />
              <Tooltip formatter={(value) => `€${value}`} />
              <Bar dataKey="profit" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Bookings by Sales Agent */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-gray-100 mb-4">Bookings by Sales Agent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentBookingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agent" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-gray-900 dark:text-gray-100 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#2563EB" strokeWidth={2} name="Bookings" />
              <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit (€)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        {/* Recent Bookings */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-gray-100 mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Booking Ref</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Client</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Mode</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Service ID</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">ETD / ETA</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Sales Agent</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Profit (EUR)</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.bookingReference}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.clientName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getModeIcon(booking.mode)}
                        <span className="text-sm text-gray-900 dark:text-gray-100">{booking.mode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.serviceIdentifier}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(booking.etd).toLocaleDateString()} / {new Date(booking.eta).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.salesAgent}</td>
                    <td className={`py-3 px-4 text-sm text-right ${booking.profitEUR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{booking.profitEUR.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewBooking?.(booking)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bookings Requiring Attention */}
        {attentionRequired.length > 0 && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-gray-900 dark:text-gray-100">Bookings Requiring Attention ({attentionRequired.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Booking Ref</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Client</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Issues</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Sales Agent</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionRequired.map((booking) => {
                    const issues = [];
                    if (!booking.hasDocuments) issues.push('Missing Documents');
                    if (!booking.hasInvoices) issues.push('Missing Invoices');
                    if (!booking.hasSupplier) issues.push('No Supplier');
                    if (booking.isDelayed) issues.push('Delayed');

                    return (
                      <tr key={booking.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.bookingReference}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.clientName}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {issues.map((issue, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.salesAgent}</td>
                        <td className="py-3 px-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onViewBooking?.(booking)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Upcoming Shipments */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-gray-100 mb-4">Upcoming Shipments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Booking Ref</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Origin</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Destination</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Vessel/Flight</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">ETA</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingShipments.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.bookingReference}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.origin}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.destination}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{booking.vesselFlightNumber || 'TBC'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(booking.eta).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewBooking?.(booking)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Future-Ready Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 border-dashed opacity-60">
          <h4 className="text-sm text-gray-700 dark:text-gray-400 mb-2">Forecasting</h4>
          <p className="text-xs text-gray-500 dark:text-gray-500">Coming Soon</p>
        </Card>
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 border-dashed opacity-60">
          <h4 className="text-sm text-gray-700 dark:text-gray-400 mb-2">Volume Trends</h4>
          <p className="text-xs text-gray-500 dark:text-gray-500">Coming Soon</p>
        </Card>
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 border-dashed opacity-60">
          <h4 className="text-sm text-gray-700 dark:text-gray-400 mb-2">Supplier Performance</h4>
          <p className="text-xs text-gray-500 dark:text-gray-500">Coming Soon</p>
        </Card>
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 border-dashed opacity-60">
          <h4 className="text-sm text-gray-700 dark:text-gray-400 mb-2">Client Profitability</h4>
          <p className="text-xs text-gray-500 dark:text-gray-500">Coming Soon</p>
        </Card>
      </div>
    </div>
  );
}
