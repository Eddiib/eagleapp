import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

test('auth bootstrap still gates the app through login and session restore', () => {
  const appSource = read('App.tsx');
  const authContextSource = read('context/AuthContext.tsx');

  assert.match(appSource, /if\s*\(!user\)\s*return\s*<LoginPage\s*\/>/);
  assert.match(authContextSource, /api\.get<\{ user: AuthUser \}>\('\/auth\/me'\)/);
  assert.match(authContextSource, /clearToken\(\);/);
});

test('active MVP modules stay wired to live APIs instead of mock production paths', () => {
  const moduleChecks = [
    ['components/Partners.tsx', ['partnersApi.create', 'partnersApi.update', 'partnersApi.delete']],
    ['components/EmployeesModule.tsx', ['employeesApi.getAll', 'employeesApi.create', 'employeesApi.update', 'employeesApi.delete']],
    ['components/Equipment.tsx', ['equipmentApi.getAll', 'equipmentApi.create', 'equipmentApi.update']],
    ['components/BookingList.tsx', ['bookingsApi.getAll', 'bookingsApi.delete']],
    ['components/QuotationDeskManager.tsx', ['quotationsApi.getById', 'quotationsApi.create', 'quotationsApi.update', 'quotationsApi.delete']],
    ['components/SalesLeads.tsx', ['salesLeadsApi.getAll', 'salesLeadsApi.createMinute']],
    ['components/CostControl.tsx', ['costControlApi.getAll', 'bookingsApi.getAll']],
    ['components/ServiceManagement.tsx', ['servicesApi.getAll', 'servicesApi.getAllGroups', 'servicesApi.createGroup', 'servicesApi.deleteGroup']],
  ];

  for (const [file, patterns] of moduleChecks) {
    const source = read(file);
    patterns.forEach((pattern) => assert.match(source, new RegExp(pattern.replaceAll('.', '\\.'))));
  }

  const serviceManagement = read('components/ServiceManagement.tsx');
  const legacyServices = read('components/Services.tsx');
  const legacyNewBooking = read('components/NewBooking.tsx');

  assert.doesNotMatch(serviceManagement, /mockServices/);
  assert.match(legacyServices, /ServiceManagement/);
  assert.doesNotMatch(legacyServices, /mockServices/);
  assert.match(legacyNewBooking, /shared booking shell/i);
  assert.doesNotMatch(legacyNewBooking, /bookingsApi/);
});

test('service adapter keeps snake_case normalization at the API boundary', () => {
  const servicesApiSource = read('services/services.ts');

  assert.match(servicesApiSource, /function toService\(row: ServiceRow\): Service/);
  assert.match(servicesApiSource, /service_code/);
  assert.match(servicesApiSource, /transport_modes/);
  assert.match(servicesApiSource, /default_where_used/);
  assert.match(servicesApiSource, /default_modes/);
  assert.match(servicesApiSource, /deleteGroup: \(id: string\)/);
});

test('booking service keeps sequential number preview and full edit hydration support', () => {
  const bookingsApiSource = read('services/bookings.ts');
  const appSource = read('App.tsx');

  assert.match(bookingsApiSource, /getNextNumber: async \(\): Promise<string>/);
  assert.match(bookingsApiSource, /booking_number: string/);
  assert.match(bookingsApiSource, /\[\{ shipperId: row\.shipper_id, shipperName: row\.shipper_name \?\? undefined \}\]/);
  assert.match(bookingsApiSource, /padStart\(4, '0'\)/);

  assert.match(appSource, /await bookingsApi\.getById\(booking\.id\)/);
  assert.match(appSource, /await bookingsApi\.getNextNumber\(\)\.catch/);
  assert.match(appSource, /emptyBooking\(nextBookingNumber, baseCurrency\)/);
  assert.match(bookingsApiSource, /emptyBooking\(initialBookingNumber\?: string, currency = 'EUR'\)/);
  assert.match(appSource, /const \{ bookingNumber: _bookingNumber, \.\.\.createPayload \} = payload;/);
  assert.match(bookingsApiSource, /consigneeId: b\.consigneeId \|\| undefined/);
  assert.match(bookingsApiSource, /notifyPartyId: b\.notifyPartyId \|\| undefined/);
  assert.match(bookingsApiSource, /freightTerms: b\.freightTerms/);
  assert.match(bookingsApiSource, /placeOfLoadingCity: b\.placeOfLoadingCity/);
  assert.match(bookingsApiSource, /placeOfLoadingCountry: b\.placeOfLoadingCountry/);
  assert.match(bookingsApiSource, /finalDestination: b\.finalDestination/);
  assert.match(bookingsApiSource, /cargoReadinessDate: b\.cargoReadinessDate \|\| undefined/);
  assert.match(bookingsApiSource, /cargoNature: b\.cargoNature/);
});

test('released modules stay live and remaining staged handoffs are explicit', () => {
  const pricingDepartment = read('components/pricing/PricingDepartment.tsx');
  const meetingMinutes = read('components/MeetingMinutes.tsx');
  const salesLeadsList = read('components/SalesLeadsList.tsx');
  const salesLeadDetail = read('components/SalesLeadDetail.tsx');
  const appSource = read('App.tsx');

  assert.match(pricingDepartment, /<AvailableLoads \/>/);
  assert.match(pricingDepartment, /<BuyRatesContracts \/>/);
  assert.match(pricingDepartment, /<PricingModels \/>/);
  assert.match(pricingDepartment, /<SupplierDirectory \/>/);
  assert.doesNotMatch(pricingDepartment, /alert\(/);
  assert.doesNotMatch(pricingDepartment, /confirm\(/);

  assert.match(meetingMinutes, /salesLeadsApi\.getAllMinutes/);
  assert.match(meetingMinutes, /<MeetingMinutesForm/);

  assert.match(salesLeadsList, /Lead-to-quotation conversion/);
  assert.match(salesLeadDetail, /Lead-to-quotation conversion/);
  assert.doesNotMatch(salesLeadsList, /This would navigate/);
  assert.doesNotMatch(salesLeadDetail, /This would navigate/);

  assert.match(appSource, /<MeetingMinutes \/>/);
});

test('employee overlay uses live persistence instead of placeholder callbacks', () => {
  const appSource = read('App.tsx');
  const employeeFormSource = read('components/EmployeeForm.tsx');

  assert.match(appSource, /employeesApi\.create/);
  assert.match(appSource, /employeesApi\.update/);
  assert.match(appSource, /employeesApi\.getById/);
  assert.doesNotMatch(appSource, /Employee saved successfully!/);
  assert.doesNotMatch(appSource, /Toggle active for employee:/);

  assert.match(employeeFormSource, /await onSave\(employeeData, \{ saveAndNew \}\)/);
  assert.match(employeeFormSource, /Failed to save employee/);
  assert.match(employeeFormSource, /Saving\.\.\./);
});

test('ports management honors edit permission and picker surfaces load errors', () => {
  const portsManagementSource = read('components/PortsManagement.tsx');
  const portPickerSource = read('components/PortPicker.tsx');

  assert.match(portsManagementSource, /modulePermission\('ports-management', 'edit'\)/);
  assert.match(portsManagementSource, /canEditPorts && \(/);
  assert.match(portPickerSource, /const \{ ports, loading, error, refresh \} = usePorts\(\)/);
  assert.match(portPickerSource, /Unable to load ports/);
  assert.match(portPickerSource, /> Retry/);
});
