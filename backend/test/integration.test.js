const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');

const db = require('../src/db');
const { startServer } = require('../src/index');

const TEST_ADMIN = {
  username: 'phase7_test_admin',
  email: 'phase7_test_admin@eagle.local',
  password: 'phase7-admin-123',
};

let server;
let baseUrl;
let testAdminId;

async function ensureTestAdmin() {
  const hash = await bcrypt.hash(TEST_ADMIN.password, 10);
  await db.query(
    `INSERT INTO users (id, username, email, password_hash, role, is_active)
     VALUES (?,?,?,?,?,1)
     ON DUPLICATE KEY UPDATE
       email = VALUES(email),
       password_hash = VALUES(password_hash),
       role = VALUES(role),
       is_active = VALUES(is_active)`,
    [randomUUID(), TEST_ADMIN.username, TEST_ADMIN.email, hash, 'admin']
  );

  const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [TEST_ADMIN.username]);
  testAdminId = rows[0].id;
}

async function jsonRequest(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  return { status: response.status, body: payload };
}

async function loginAsTestAdmin() {
  const loginResponse = await jsonRequest('/api/auth/login', {
    method: 'POST',
    body: {
      username: TEST_ADMIN.username,
      password: TEST_ADMIN.password,
    },
  });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.body.token);
  return loginResponse.body.token;
}

async function cleanupIds(table, ids) {
  if (!ids.length) return;
  await db.query(`DELETE FROM ${table} WHERE id IN (?)`, [ids]);
}

async function cleanupByForeignKey(table, column, ids) {
  if (!ids.length) return;
  await db.query(`DELETE FROM ${table} WHERE ${column} IN (?)`, [ids]);
}

test.before(async () => {
  await ensureTestAdmin();
  const started = startServer(0);
  server = started.server;
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  if (testAdminId) {
    await db.query('DELETE FROM users WHERE id = ?', [testAdminId]);
  }
  await db.end();
});

test('protected routes require auth', async () => {
  const response = await jsonRequest('/api/partners');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'NO_TOKEN');
});

test('MVP API smoke flow covers auth, master data, bookings, CRM, services, and cost control', async () => {
  const token = await loginAsTestAdmin();
  const suffix = Date.now().toString();
  const short = suffix.slice(-6);

  const tracker = {
    employeeIds: [],
    partnerIds: [],
    serviceGroupIds: [],
    serviceIds: [],
    equipmentIds: [],
    bookingIds: [],
    quotationIds: [],
    salesLeadIds: [],
    meetingMinuteIds: [],
    costControlIds: [],
  };

  try {
    const meResponse = await jsonRequest('/api/auth/me', { token });
    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.user.username, TEST_ADMIN.username);

    const employeePayload = {
      employee_code: `PH7E${short}`,
      first_name: 'Phase',
      surname: 'Seven',
      position: 'Sales Executive',
      department: 'Sales',
      is_active: true,
      is_sales_person: true,
      date_of_hire: '2026-01-10',
      email: `phase7-employee-${suffix}@eagle.local`,
      phone: '+381600000001',
      has_system_access: true,
      personal_email: `phase7-employee-personal-${suffix}@eagle.local`,
    };

    const employeeCreate = await jsonRequest('/api/employees', {
      method: 'POST',
      token,
      body: employeePayload,
    });
    assert.equal(employeeCreate.status, 201);
    tracker.employeeIds.push(employeeCreate.body.id);

    const employeeList = await jsonRequest('/api/employees', { token });
    assert.equal(employeeList.status, 200);
    assert.ok(employeeList.body.some((employee) => employee.id === employeeCreate.body.id));

    const employeeUpdate = await jsonRequest(`/api/employees/${employeeCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...employeePayload,
        first_name: 'Phase Updated',
      },
    });
    assert.equal(employeeUpdate.status, 200);

    const partnerClientPayload = {
      partner_code: `PH7CL${short}`,
      company_legal_name: 'Phase Seven Client LLC',
      trading_name: 'Phase Seven Client',
      partner_type: 'Client',
      partner_class: 'Non Carrier',
      partner_roles: ['Buyer', 'Seller'],
      partner_category: 'Client',
      country: 'Serbia',
      city: 'Belgrade',
      address: 'Testing Street 1',
      zip_code: '11000',
      tax_number: `TAX-${suffix}-CLIENT`,
      registration_number: `REG-${suffix}-CLIENT`,
      payment_terms: '30 Days',
      currency: 'EUR',
      default_service_type: 'Sea',
      notes: 'Phase 7 client partner',
      status: 'Active',
      rating: 3,
      open_balance: 0,
      contacts: [
        {
          name: 'Client Contact',
          position: 'Logistics Manager',
          phone: '+381600000002',
          email: `client-contact-${suffix}@eagle.local`,
          isPrimary: true,
        },
      ],
      bankDetails: [],
      deliveryAddresses: [
        {
          addressName: 'Main Warehouse',
          fullAddress: 'Warehouse Street 10',
          city: 'Belgrade',
          country: 'Serbia',
          zipCode: '11000',
          contactPerson: 'Warehouse Lead',
          contactPhone: '+381600000003',
          isDefault: true,
        },
      ],
      tradeMarketInfo: [
        {
          countryOfOrigin: 'RS',
          countryOfDestination: 'DE',
          placeOfLoading: 'Belgrade',
          pol: 'RSBEG',
          pod: 'DEHAM',
          finalDestination: 'Hamburg',
          totalAnnualVolume: '12 TEU',
          preferredCorridor: 'RS-DE',
          modeOfTransport: 'Road',
        },
      ],
      created_by: TEST_ADMIN.username,
    };

    const partnerCarrierPayload = {
      partner_code: `PH7CA${short}`,
      company_legal_name: 'Phase Seven Carrier Ltd',
      trading_name: 'Phase Seven Carrier',
      partner_type: 'Shipping Line',
      partner_class: 'Carrier',
      partner_roles: ['Seller'],
      partner_category: 'Shipping Line',
      country: 'Germany',
      city: 'Hamburg',
      address: 'Port Street 5',
      zip_code: '20457',
      tax_number: `TAX-${suffix}-CARRIER`,
      registration_number: `REG-${suffix}-CARRIER`,
      payment_terms: '30 Days',
      currency: 'EUR',
      default_service_type: 'Sea',
      notes: 'Phase 7 carrier partner',
      status: 'Active',
      rating: 3,
      open_balance: 0,
      contacts: [],
      bankDetails: [],
      deliveryAddresses: [],
      tradeMarketInfo: [],
      created_by: TEST_ADMIN.username,
    };

    const clientCreate = await jsonRequest('/api/partners', {
      method: 'POST',
      token,
      body: partnerClientPayload,
    });
    assert.equal(clientCreate.status, 201);
    tracker.partnerIds.push(clientCreate.body.id);

    const carrierCreate = await jsonRequest('/api/partners', {
      method: 'POST',
      token,
      body: partnerCarrierPayload,
    });
    assert.equal(carrierCreate.status, 201);
    tracker.partnerIds.push(carrierCreate.body.id);

    const partnerDetail = await jsonRequest(`/api/partners/${clientCreate.body.id}`, { token });
    assert.equal(partnerDetail.status, 200);
    assert.deepEqual(partnerDetail.body.partner_roles, ['Buyer', 'Seller']);
    assert.equal(partnerDetail.body.contacts.length, 1);
    assert.equal(partnerDetail.body.tradeMarketInfo.length, 1);

    const carrierUpdateWithJsonRoles = await jsonRequest(`/api/partners/${carrierCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...partnerCarrierPayload,
        partner_roles: '["Buyer","Seller"]',
      },
    });
    assert.equal(carrierUpdateWithJsonRoles.status, 200);

    const partnerUpdate = await jsonRequest(`/api/partners/${clientCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...partnerClientPayload,
        city: 'Novi Sad',
        contacts: partnerDetail.body.contacts.map((contact) => ({
          ...contact,
          isPrimary: contact.is_primary === 1 || contact.isPrimary,
        })),
        deliveryAddresses: partnerDetail.body.deliveryAddresses.map((address) => ({
          id: address.id,
          addressName: address.address_name,
          fullAddress: address.full_address,
          city: address.city,
          country: address.country,
          zipCode: address.zip_code,
          contactPerson: address.contact_person,
          contactPhone: address.contact_phone,
          isDefault: address.is_default === 1,
        })),
      },
    });
    assert.equal(partnerUpdate.status, 200);

    const serviceGroupPayload = {
      group_code: `PH7SG${short}`,
      group_name: 'Phase 7 Service Group',
      description: 'Phase 7 service group',
      default_where_used: ['Booking', 'Finance/Costing'],
      default_modes: ['Sea', 'Road'],
      is_active: 1,
    };

    const serviceGroupCreate = await jsonRequest('/api/services/groups', {
      method: 'POST',
      token,
      body: serviceGroupPayload,
    });
    assert.equal(serviceGroupCreate.status, 201);
    tracker.serviceGroupIds.push(serviceGroupCreate.body.id);

    const serviceGroupUpdate = await jsonRequest(`/api/services/groups/${serviceGroupCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...serviceGroupPayload,
        group_name: 'Phase 7 Service Group Updated',
      },
    });
    assert.equal(serviceGroupUpdate.status, 200);

    const servicePayload = {
      service_code: `PH7SV${short}`,
      service_name: 'Phase 7 Ocean Freight',
      category: 'Main Freight',
      transport_modes: ['Sea'],
      applies_to: ['FCL'],
      charge_unit: 'Per Container',
      buy_sell_type: 'Both',
      default_vat_rate: 20,
      default_gl_code: '4100-PH7',
      price_behavior: 'Fixed',
      pricing_model_id: null,
      related_partner_types: ['Shipping Line'],
      location_type: 'At Origin',
      documentation_required: 1,
      mandatory_for_shipment_types: ['FCL'],
      is_active: 1,
      visible_to_sales: 1,
      visible_to_marketplace: 0,
      notes: 'Phase 7 service',
      created_by: TEST_ADMIN.username,
    };

    const serviceCreate = await jsonRequest('/api/services', {
      method: 'POST',
      token,
      body: servicePayload,
    });
    assert.equal(serviceCreate.status, 201);
    tracker.serviceIds.push(serviceCreate.body.id);

    const serviceDetail = await jsonRequest(`/api/services/${serviceCreate.body.id}`, { token });
    assert.equal(serviceDetail.status, 200);
    assert.equal(serviceDetail.body.service_code, servicePayload.service_code);
    assert.equal(serviceDetail.body.default_currency, 'EUR');

    const serviceUpdate = await jsonRequest(`/api/services/${serviceCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...servicePayload,
        service_name: 'Phase 7 Ocean Freight Updated',
        modified_by: TEST_ADMIN.username,
      },
    });
    assert.equal(serviceUpdate.status, 200);

    const equipmentPayload = {
      equipment_code: `PH7EQ${short}`,
      equipment_name: 'Phase 7 Container',
      category: 'Container',
      size: "40' HC",
      specifications: 'High cube test container',
      teu_equivalent: 2,
      is_active: true,
      notes: 'Phase 7 equipment',
      created_by: TEST_ADMIN.username,
    };

    const equipmentCreate = await jsonRequest('/api/equipment', {
      method: 'POST',
      token,
      body: equipmentPayload,
    });
    assert.equal(equipmentCreate.status, 201);
    tracker.equipmentIds.push(equipmentCreate.body.id);

    const equipmentUpdate = await jsonRequest(`/api/equipment/${equipmentCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...equipmentPayload,
        equipment_name: 'Phase 7 Container Updated',
        updated_by: TEST_ADMIN.username,
      },
    });
    assert.equal(equipmentUpdate.status, 200);

    const bookingPayload = {
      booking_number: `PH7B${short}`,
      status: 'Draft',
      mode_of_transport: 'FCL',
      client_id: clientCreate.body.id,
      carrier_id: carrierCreate.body.id,
      origin_country: 'Serbia',
      origin_port: 'Belgrade',
      destination_country: 'Germany',
      destination_port: 'Hamburg',
      etd: '2026-02-01',
      eta: '2026-02-08',
      commodity: 'Electronics',
      incoterm: 'FOB',
      total_revenue: 2000,
      total_cost: 1500,
      notes: 'Phase 7 booking',
      created_by: TEST_ADMIN.username,
      services: [
        {
          service_id: serviceCreate.body.id,
          supplier_id: carrierCreate.body.id,
          quantity: 1,
          unit_price: 1500,
          total_price: 1500,
          notes: 'Booked ocean freight',
        },
      ],
      equipment: [
        {
          equipment_id: equipmentCreate.body.id,
          quantity: 1,
        },
      ],
    };

    const bookingCreate = await jsonRequest('/api/bookings', {
      method: 'POST',
      token,
      body: bookingPayload,
    });
    assert.equal(bookingCreate.status, 201);
    tracker.bookingIds.push(bookingCreate.body.id);

    const bookingDetail = await jsonRequest(`/api/bookings/${bookingCreate.body.id}`, { token });
    assert.equal(bookingDetail.status, 200);
    assert.equal(bookingDetail.body.currency, 'EUR');
    assert.equal(bookingDetail.body.services.length, 1);
    assert.equal(bookingDetail.body.services[0].currency, 'EUR');
    assert.equal(bookingDetail.body.equipment.length, 1);

    const invalidBooking = await jsonRequest('/api/bookings', {
      method: 'POST',
      token,
      body: {
        booking_number: `PH7X${short}`,
        client_id: clientCreate.body.id,
        mode_of_transport: 'Bad Mode',
        services: [],
        equipment: [],
      },
    });
    assert.equal(invalidBooking.status, 400);
    assert.equal(invalidBooking.body.code, 'INVALID_ENUM');

    const bookingUpdate = await jsonRequest(`/api/bookings/${bookingCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...bookingPayload,
        status: 'Confirmed',
        booking_date: '2026-04-16',
        consignee_id: clientCreate.body.id,
        notify_party_id: carrierCreate.body.id,
        shipper_id: clientCreate.body.id,
        shippers: [{ shipper_id: clientCreate.body.id }],
        origin_port: 'DEHAM',
        destination_port: 'BEANR',
        incoterm: 'EXW',
        freight_terms: 'Collect',
        final_destination: 'Munich',
        place_of_loading_city: 'Belgrade',
        place_of_loading_country: 'RS',
        cargo_readiness_date: '2026-01-28',
        cargo_nature: 'General Cargo',
        notes: 'Phase 7 booking updated',
        updated_by: TEST_ADMIN.username,
      },
    });
    assert.equal(bookingUpdate.status, 200);

    const updatedBookingDetail = await jsonRequest(`/api/bookings/${bookingCreate.body.id}`, { token });
    assert.equal(updatedBookingDetail.status, 200);
    assert.equal(updatedBookingDetail.body.status, 'Confirmed');
    assert.equal(updatedBookingDetail.body.notes, 'Phase 7 booking updated');
    assert.equal(updatedBookingDetail.body.booking_date, '2026-04-16');
    assert.equal(updatedBookingDetail.body.consignee_id, clientCreate.body.id);
    assert.equal(updatedBookingDetail.body.notify_party_id, carrierCreate.body.id);
    assert.equal(updatedBookingDetail.body.shipper_id, clientCreate.body.id);
    assert.equal(updatedBookingDetail.body.shippers.length, 1);
    assert.equal(updatedBookingDetail.body.shippers[0].shipper_id, clientCreate.body.id);
    assert.equal(updatedBookingDetail.body.origin_port, 'DEHAM');
    assert.equal(updatedBookingDetail.body.destination_port, 'BEANR');
    assert.equal(updatedBookingDetail.body.incoterm, 'EXW');
    assert.equal(updatedBookingDetail.body.freight_terms, 'Collect');
    assert.equal(updatedBookingDetail.body.final_destination, 'Munich');
    assert.equal(updatedBookingDetail.body.place_of_loading_city, 'Belgrade');
    assert.equal(updatedBookingDetail.body.place_of_loading_country, 'RS');
    assert.equal(updatedBookingDetail.body.cargo_readiness_date, '2026-01-28');
    assert.equal(updatedBookingDetail.body.cargo_nature, 'General Cargo');

    const quotationPayload = {
      quote_number: `PH7Q${short}`,
      status: 'Draft',
      client_id: clientCreate.body.id,
      mode_of_transport: 'Sea',
      origin_country: 'Serbia',
      origin_port: 'Belgrade',
      destination_country: 'Germany',
      destination_port: 'Hamburg',
      valid_until: '2026-02-15',
      total_sell: 2500,
      total_cost: 1800,
      notes: 'Phase 7 quotation',
      created_by: TEST_ADMIN.username,
      services: [
        {
          service_id: serviceCreate.body.id,
          supplier_id: carrierCreate.body.id,
          quantity: 1,
          cost_price: 1800,
          sell_price: 2500,
          notes: 'Quotation service',
        },
      ],
    };

    const quotationCreate = await jsonRequest('/api/quotations', {
      method: 'POST',
      token,
      body: quotationPayload,
    });
    assert.equal(quotationCreate.status, 201);
    tracker.quotationIds.push(quotationCreate.body.id);

    const quotationDetail = await jsonRequest(`/api/quotations/${quotationCreate.body.id}`, { token });
    assert.equal(quotationDetail.status, 200);
    assert.equal(quotationDetail.body.currency, 'EUR');
    assert.equal(quotationDetail.body.services.length, 1);
    assert.equal(quotationDetail.body.services[0].currency, 'EUR');

    const quotationUpdate = await jsonRequest(`/api/quotations/${quotationCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...quotationPayload,
        status: 'Rejected',
        rejection_reason: 'Pricing too high',
      },
    });
    assert.equal(quotationUpdate.status, 200);

    const invalidQuotation = await jsonRequest('/api/quotations', {
      method: 'POST',
      token,
      body: {
        quote_number: `PH7Z${short}`,
        client_id: clientCreate.body.id,
        status: 'Nope',
        services: [],
      },
    });
    assert.equal(invalidQuotation.status, 400);
    assert.equal(invalidQuotation.body.code, 'INVALID_STATUS');

    const salesLeadCreate = await jsonRequest('/api/sales-leads', {
      method: 'POST',
      token,
      body: {
        lead_id: `PH7L${short}`,
        partner_id: clientCreate.body.id,
        assigned_sales_agent_id: employeeCreate.body.id,
        lead_status: 'New',
        lead_ranking: 'High',
      },
    });
    assert.equal(salesLeadCreate.status, 201);
    tracker.salesLeadIds.push(salesLeadCreate.body.id);

    const salesLeadDetail = await jsonRequest(`/api/sales-leads/${salesLeadCreate.body.id}`, { token });
    assert.equal(salesLeadDetail.status, 200);
    assert.equal(salesLeadDetail.body.lead_id, `PH7L${short}`);

    const meetingMinuteCreate = await jsonRequest(`/api/sales-leads/${salesLeadCreate.body.id}/minutes`, {
      method: 'POST',
      token,
      body: {
        partner_id: clientCreate.body.id,
        sales_agent_id: employeeCreate.body.id,
        sales_agent: 'Phase Updated Seven',
        contact_type: 'Phone Call',
        meeting_date: '2026-02-03',
        meeting_time: '10:00',
        summary: `Phase 7 meeting summary ${suffix}`,
        client_needs: 'Faster scheduling',
        next_action: 'Follow-Up Call',
        next_action_date: '2026-02-05',
        created_by: TEST_ADMIN.username,
      },
    });
    assert.equal(meetingMinuteCreate.status, 201);
    tracker.meetingMinuteIds.push(meetingMinuteCreate.body.id);

    const minutesList = await jsonRequest(`/api/sales-leads/${salesLeadCreate.body.id}/minutes`, { token });
    assert.equal(minutesList.status, 200);
    assert.equal(minutesList.body.length, 1);

    const costControlPayload = {
      booking_id: bookingCreate.body.id,
      service_id: serviceCreate.body.id,
      supplier_id: carrierCreate.body.id,
      description: `Phase 7 supplier invoice ${suffix}`,
      amount: 1800,
      invoice_number: `PH7I${short}`,
      invoice_date: '2026-02-04',
      due_date: '2026-02-20',
      status: 'Pending',
      created_by: TEST_ADMIN.username,
    };

    const costControlCreate = await jsonRequest('/api/cost-control', {
      method: 'POST',
      token,
      body: costControlPayload,
    });
    assert.equal(costControlCreate.status, 201);
    tracker.costControlIds.push(costControlCreate.body.id);

    const costControlUpdate = await jsonRequest(`/api/cost-control/${costControlCreate.body.id}`, {
      method: 'PUT',
      token,
      body: {
        ...costControlPayload,
        status: 'Approved',
      },
    });
    assert.equal(costControlUpdate.status, 200);

    const costControlDetail = await jsonRequest(`/api/cost-control/${costControlCreate.body.id}`, { token });
    assert.equal(costControlDetail.status, 200);
    assert.equal(costControlDetail.body.status, 'Approved');
    assert.equal(costControlDetail.body.currency, 'EUR');
    assert.equal(costControlDetail.body.selling_currency, 'EUR');

    const serviceGroupDelete = await jsonRequest(`/api/services/groups/${serviceGroupCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(serviceGroupDelete.status, 200);
    tracker.serviceGroupIds = tracker.serviceGroupIds.filter((id) => id !== serviceGroupCreate.body.id);

    const serviceGroupRecreate = await jsonRequest('/api/services/groups', {
      method: 'POST',
      token,
      body: serviceGroupPayload,
    });
    assert.equal(serviceGroupRecreate.status, 201);
    tracker.serviceGroupIds.push(serviceGroupRecreate.body.id);

    const deleteCostControl = await jsonRequest(`/api/cost-control/${costControlCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteCostControl.status, 200);
    tracker.costControlIds = [];

    const deleteSalesLead = await jsonRequest(`/api/sales-leads/${salesLeadCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteSalesLead.status, 200);
    tracker.salesLeadIds = [];
    tracker.meetingMinuteIds = [];

    const deleteQuotation = await jsonRequest(`/api/quotations/${quotationCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteQuotation.status, 200);
    tracker.quotationIds = [];

    const deleteBooking = await jsonRequest(`/api/bookings/${bookingCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteBooking.status, 200);
    tracker.bookingIds = [];

    const deleteEquipment = await jsonRequest(`/api/equipment/${equipmentCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteEquipment.status, 200);
    tracker.equipmentIds = [];

    const deleteService = await jsonRequest(`/api/services/${serviceCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteService.status, 200);
    tracker.serviceIds = [];

    const deleteServiceGroup = await jsonRequest(`/api/services/groups/${serviceGroupRecreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteServiceGroup.status, 200);
    tracker.serviceGroupIds = [];

    const deleteClient = await jsonRequest(`/api/partners/${clientCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteClient.status, 200);

    const deleteCarrier = await jsonRequest(`/api/partners/${carrierCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteCarrier.status, 200);
    tracker.partnerIds = [];

    const deleteEmployee = await jsonRequest(`/api/employees/${employeeCreate.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteEmployee.status, 200);
    tracker.employeeIds = [];
  } finally {
    await cleanupIds('cost_control', tracker.costControlIds);
    await cleanupIds('meeting_minutes', tracker.meetingMinuteIds);
    await cleanupByForeignKey('meeting_minutes', 'sales_lead_id', tracker.salesLeadIds);
    await cleanupIds('sales_leads', tracker.salesLeadIds);
    await cleanupByForeignKey('quotation_services', 'quotation_id', tracker.quotationIds);
    await cleanupIds('quotations', tracker.quotationIds);
    await cleanupByForeignKey('booking_services', 'booking_id', tracker.bookingIds);
    await cleanupByForeignKey('booking_equipment', 'booking_id', tracker.bookingIds);
    await cleanupIds('bookings', tracker.bookingIds);
    await cleanupIds('equipment', tracker.equipmentIds);
    await cleanupIds('services', tracker.serviceIds);
    await cleanupIds('service_groups', tracker.serviceGroupIds);
    await cleanupByForeignKey('partner_contacts', 'partner_id', tracker.partnerIds);
    await cleanupByForeignKey('partner_bank_details', 'partner_id', tracker.partnerIds);
    await cleanupByForeignKey('partner_delivery_addresses', 'partner_id', tracker.partnerIds);
    await cleanupByForeignKey('partner_trade_lanes', 'partner_id', tracker.partnerIds);
    await cleanupIds('partners', tracker.partnerIds);
    await cleanupIds('employees', tracker.employeeIds);
  }
});
