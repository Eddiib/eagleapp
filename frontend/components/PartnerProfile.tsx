import { Partner } from '../types/partner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  FileText,
  TrendingUp,
  AlertTriangle,
  Users,
  Star,
  Edit,
  Download,
  Upload
} from 'lucide-react';
import { getCountryName } from '../data/countries';
import { normalizePartnerRoles } from '../utils/partnerRoles';

interface PartnerProfileProps {
  partner: Partner;
  onBack: () => void;
  onEdit: () => void;
}

export function PartnerProfile({ partner, onBack, onEdit }: PartnerProfileProps) {
  const primaryContact = partner.contacts.find(c => c.isPrimary) || partner.contacts[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Blacklisted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  // Linked records from partner data (empty until API endpoints exist)
  const linkedBookings = partner.linkedBookings || [];
  const linkedQuotations = partner.linkedQuotations || [];
  const financialRecords = partner.financialRecords || [];
  const disputes = partner.disputes || [];

  const documents = partner.documents || [];
  const activityLog = partner.activityLog || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-gray-900 dark:text-white">{partner.tradingName}</h1>
                <Badge className={getStatusColor(partner.status)}>
                  {partner.status}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{partner.companyLegalName}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-gray-500 dark:text-gray-400">Partner Code: {partner.partnerCode}</span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <Badge variant="outline">{partner.partnerType}</Badge>
                {normalizePartnerRoles(partner).map((role) => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))}
                <span className="text-gray-400 dark:text-gray-500">•</span>
                {renderStars(partner.rating)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button onClick={onEdit} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4" />
              Edit Partner
            </Button>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Open Balance</p>
                <p className={`${partner.openBalance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                  {partner.currency} {partner.openBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Active Bookings</p>
                <p className="text-gray-900 dark:text-gray-100">{linkedBookings.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Quotations</p>
                <p className="text-gray-900 dark:text-gray-100">{linkedQuotations.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Disputes</p>
                <p className="text-gray-900 dark:text-gray-100">{disputes.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700 w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Overview
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Contacts
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="quotations" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Quotations
          </TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Financials
          </TabsTrigger>
          <TabsTrigger value="disputes" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Disputes
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Documents
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card className="p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Legal Name</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.companyLegalName}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Trading Name</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.tradingName}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Partner Type</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.partnerType}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Commercial Role</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{normalizePartnerRoles(partner).join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Tax Number</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.taxNumber}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Registration Number</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.registrationNumber}</dd>
                </div>
                {partner.website && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </dt>
                    <dd className="text-blue-600">
                      <a href={`https://${partner.website}`} target="_blank" rel="noopener noreferrer">
                        {partner.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Address Information */}
            <Card className="p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Address</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.address}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">City</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.city}</dd>
                </div>
                {partner.zipCode && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Zip Code</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{partner.zipCode}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Country</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{getCountryName(partner.country)}</dd>
                </div>
              </dl>
            </Card>

            {/* Primary Contact */}
            <Card className="p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Primary Contact
              </h3>
              {primaryContact ? (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Name</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{primaryContact.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Position</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{primaryContact.position}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </dt>
                    <dd className="text-gray-900 dark:text-gray-100">{primaryContact.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </dt>
                    <dd className="text-blue-600">
                      <a href={`mailto:${primaryContact.email}`}>{primaryContact.email}</a>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No primary contact</p>
              )}
            </Card>

            {/* Financial Information */}
            <Card className="p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Financial Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Payment Terms</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.paymentTerms}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Currency</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.currency}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Default Service</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{partner.defaultServiceType}</dd>
                </div>
                {partner.mainTrades && partner.mainTrades.length > 0 && (
                  <div className="md:col-span-2">
                    <dt className="text-gray-600 dark:text-gray-400 mb-2">Main / Preferred Trades</dt>
                    <dd className="flex flex-wrap gap-2">
                      {partner.mainTrades.map((countryCode) => (
                        <Badge
                          key={countryCode}
                          variant="secondary"
                          className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        >
                          <Globe className="w-3 h-3 inline mr-1" />
                          {getCountryName(countryCode)}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Open Balance</dt>
                  <dd className={partner.openBalance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}>
                    {partner.currency} {partner.openBalance.toLocaleString()}
                  </dd>
                </div>
                {partner.creditLimit && partner.creditLimit > 0 && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Credit Limit</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {partner.currency} {partner.creditLimit.toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Bank Details */}
            <Card className="p-6 md:col-span-2">
              <h3 className="text-gray-900 dark:text-gray-100 mb-4">Bank Details</h3>
              {(!partner.bankDetails || partner.bankDetails.length === 0) ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No bank details on file.</p>
              ) : (
                <div className="space-y-4">
                  {partner.bankDetails.map((bank, idx) => (
                    <dl key={bank.id ?? idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                      <div>
                        <dt className="text-gray-600 dark:text-gray-400">Bank Name</dt>
                        <dd className="text-gray-900 dark:text-gray-100">{bank.bankName}</dd>
                      </div>
                      {bank.swift && (
                        <div>
                          <dt className="text-gray-600 dark:text-gray-400">SWIFT/BIC</dt>
                          <dd className="text-gray-900 dark:text-gray-100">{bank.swift}</dd>
                        </div>
                      )}
                      {bank.iban && (
                        <div>
                          <dt className="text-gray-600 dark:text-gray-400">IBAN</dt>
                          <dd className="text-gray-900 dark:text-gray-100">{bank.iban}</dd>
                        </div>
                      )}
                      {bank.accountNumber && (
                        <div>
                          <dt className="text-gray-600 dark:text-gray-400">Account Number</dt>
                          <dd className="text-gray-900 dark:text-gray-100">{bank.accountNumber}</dd>
                        </div>
                      )}
                      {bank.currency && (
                        <div>
                          <dt className="text-gray-600 dark:text-gray-400">Currency</dt>
                          <dd className="text-gray-900 dark:text-gray-100">{bank.currency}</dd>
                        </div>
                      )}
                      {bank.isDefault && (
                        <div className="md:col-span-2">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Default Account</Badge>
                        </div>
                      )}
                    </dl>
                  ))}
                </div>
              )}
            </Card>

            {/* Notes */}
            {partner.notes && (
              <Card className="p-6 md:col-span-2">
                <h3 className="text-gray-900 dark:text-gray-100 mb-4">Notes</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{partner.notes}</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-gray-100">All Contacts</h3>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Add Contact
              </Button>
            </div>
            <div className="space-y-4">
              {partner.contacts.map((contact) => (
                <Card key={contact.id} className="p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-gray-900 dark:text-gray-100">{contact.name}</h4>
                        {contact.isPrimary && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Primary</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{contact.position}</p>
                      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </span>
                        <span className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${contact.email}`} className="text-blue-600">
                            {contact.email}
                          </a>
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-6">
          <Card className="p-6">
            <h3 className="text-gray-900 dark:text-gray-100 mb-4">Linked Bookings</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="text-blue-600 cursor-pointer hover:underline">
                      {booking.bookingNumber}
                    </TableCell>
                    <TableCell>{booking.customer}</TableCell>
                    <TableCell>{booking.origin}</TableCell>
                    <TableCell>{booking.destination}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.status}</Badge>
                    </TableCell>
                    <TableCell>{booking.createdDate}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations" className="mt-6">
          <Card className="p-6">
            <h3 className="text-gray-900 dark:text-gray-100 mb-4">Linked Quotations</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedQuotations.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="text-blue-600 cursor-pointer hover:underline">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>{quote.customer}</TableCell>
                    <TableCell>{quote.validUntil}</TableCell>
                    <TableCell className="text-right">
                      {quote.currency} {quote.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{quote.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="mt-6">
          <Card className="p-6">
            <h3 className="text-gray-900 dark:text-gray-100 mb-4">Outstanding Payables / Receivables</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="outline">{record.type}</Badge>
                    </TableCell>
                    <TableCell className="text-blue-600 cursor-pointer hover:underline">
                      {record.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.currency} {record.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{record.dueDate}</TableCell>
                    <TableCell>
                      <Badge className={
                        record.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        record.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="mt-6">
          <Card className="p-6">
            <h3 className="text-gray-900 dark:text-gray-100 mb-4">Dispute History</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute Number</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Resolved Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="text-blue-600 cursor-pointer hover:underline">
                      {dispute.disputeNumber}
                    </TableCell>
                    <TableCell>{dispute.subject}</TableCell>
                    <TableCell>
                      <Badge className={
                        dispute.severity === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        dispute.severity === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        dispute.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }>
                        {dispute.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{dispute.status}</Badge>
                    </TableCell>
                    <TableCell>{dispute.createdDate}</TableCell>
                    <TableCell>{dispute.resolvedDate || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-gray-100">Documents</h3>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-blue-600 cursor-pointer hover:underline">
                      {doc.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>{doc.uploadedDate}</TableCell>
                    <TableCell>{doc.uploadedBy}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card className="p-6">
            <h3 className="text-gray-900 dark:text-gray-100 mb-4">Activity Log</h3>
            <div className="space-y-4">
              {activityLog.map((log) => (
                <div key={log.id} className="border-l-2 border-blue-600 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-gray-600 dark:text-gray-400">{log.performedAt}</span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100">{log.description}</p>
                  <p className="text-gray-600 dark:text-gray-400">by {log.performedBy}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
