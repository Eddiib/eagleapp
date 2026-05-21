const VALID_STATUSES = ['Active', 'Suspended', 'Blacklisted', 'Archived'];

const COUNTRY_ALIASES = new Map([
  ['ALBANIA', 'AL'],
  ['SHQIPERIA', 'AL'],
  ['SHQIPERIA', 'AL'],
  ['SHQIPËRIA', 'AL'],
  ['AUSTRIA', 'AT'],
  ['BULGARIA', 'BG'],
  ['CHILE', 'CL'],
  ['CHINA', 'CN'],
  ['CROATIA', 'HR'],
  ['CYPRUS', 'CY'],
  ['EGYPT', 'EG'],
  ['GERMANY', 'DE'],
  ['GREECE', 'GR'],
  ['HONG KONG', 'HK'],
  ['INDIA', 'IN'],
  ['IRELAND', 'IE'],
  ['ISRAEL', 'IL'],
  ['KOSOVA', 'XK'],
  ['KOSOVO', 'XK'],
  ['MALTA', 'MT'],
  ['NORTH MACEDONIA', 'MK'],
  ['MACEDONIA', 'MK'],
  ['SERBIA', 'RS'],
  ['SERBIA AND MONTENEGRO', 'RS'],
  ['SLOVENIA', 'SI'],
  ['SPAIN', 'ES'],
  ['SWEDEN', 'SE'],
  ['SWITZERLAND', 'CH'],
  ['UNITED ARAB EMIRATES', 'AE'],
  ['UAE', 'AE'],
  ['UNITED STATES', 'US'],
  ['USA', 'US'],
]);

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function normalizeLookup(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function cellText(value) {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || '').join('');
    }
    if (value.text !== undefined) return cellText(value.text);
    if (value.result !== undefined) return cellText(value.result);
    if (value.formula !== undefined) return cellText(value.result);
    if (value.hyperlink !== undefined && value.text !== undefined) return cellText(value.text);
  }
  return String(value);
}

function cleanText(value) {
  const text = cellText(value).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (/^[./\\\-\s]+$/.test(text)) return '';
  if (/^(n\/a|na|null|undefined)$/i.test(text)) return '';
  return text;
}

function cleanCode(value) {
  return cleanText(value).replace(/\.0$/, '').slice(0, 20);
}

function cleanLimited(value, limit) {
  const text = cleanText(value);
  return text ? text.slice(0, limit) : '';
}

function cleanEmail(value) {
  const email = cleanLimited(value, 150);
  if (!email) return { value: '', valid: true };
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return { value: valid ? email : '', valid };
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const text = cleanText(value).toLowerCase();
  return ['true', 'yes', 'y', '1', 'po'].includes(text);
}

function combineBusinessNumbers(values) {
  const unique = [];
  for (const value of values) {
    const clean = cleanLimited(value, 50).replace(/\.0$/, '');
    if (clean && !unique.includes(clean)) unique.push(clean);
  }
  return unique.join(' / ').slice(0, 50);
}

function normalizeCountry(value) {
  const clean = cleanText(value);
  if (!clean) return '';
  const upper = clean.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  return COUNTRY_ALIASES.get(upper) || COUNTRY_ALIASES.get(normalizeLookup(clean)) || clean;
}

function normalizeStatus(value) {
  const clean = cleanText(value);
  if (VALID_STATUSES.includes(clean)) return clean;
  return parseBoolean(value) ? 'Archived' : 'Active';
}

function buildHeaderMap(headerRow) {
  const map = new Map();
  headerRow.forEach((header, index) => {
    const key = normalizeKey(cleanText(header));
    if (!key) return;
    const existing = map.get(key) || [];
    existing.push(index);
    map.set(key, existing);
  });
  return map;
}

function firstIndex(headerMap, key) {
  const indexes = headerMap.get(key);
  return Array.isArray(indexes) && indexes.length > 0 ? indexes[0] : -1;
}

function valuesFor(row, headerMap, key) {
  return (headerMap.get(key) || []).map((index) => row[index]);
}

function valueFor(row, headerMap, key) {
  const index = firstIndex(headerMap, key);
  return index === -1 ? '' : row[index];
}

function normalizePartnerImportRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { records: [], skippedRows: [{ rowNumber: 0, reason: 'The workbook is empty' }], warnings: [] };
  }

  const headerMap = buildHeaderMap(rows[0]);
  const required = ['business_legal_name'];
  const missing = required.filter((key) => firstIndex(headerMap, key) === -1);
  if (missing.length) {
    return {
      records: [],
      skippedRows: [{ rowNumber: 1, reason: `Missing required column(s): ${missing.join(', ')}` }],
      warnings: [],
    };
  }

  const records = [];
  const skippedRows = [];
  const warnings = [];

  rows.slice(1).forEach((row, offset) => {
    const rowNumber = offset + 2;
    const companyLegalName = cleanLimited(valueFor(row, headerMap, 'business_legal_name'), 200);
    if (!companyLegalName) {
      skippedRows.push({ rowNumber, reason: 'Missing Business Legal Name' });
      return;
    }

    const rawEmail = valueFor(row, headerMap, 'email');
    const email = cleanEmail(rawEmail);
    if (!email.valid) {
      warnings.push({ rowNumber, message: `Invalid email ignored: ${cleanText(rawEmail)}` });
    }

    const buyer = parseBoolean(valueFor(row, headerMap, 'buyer'));
    const seller = parseBoolean(valueFor(row, headerMap, 'seller'));
    const partnerRoles = [];
    if (buyer) partnerRoles.push('Buyer');
    if (seller) partnerRoles.push('Seller');
    if (partnerRoles.length === 0) {
      partnerRoles.push('Buyer');
      warnings.push({ rowNumber, message: 'No Buyer/Seller role found; defaulted to Buyer' });
    }

    const phone = cleanLimited(valueFor(row, headerMap, 'phone'), 50);
    const contact = (phone || email.value)
      ? [{
          name: 'Primary Contact',
          position: '',
          phone,
          email: email.value,
          isPrimary: true,
        }]
      : [];

    const tradingName = cleanLimited(valueFor(row, headerMap, 'business_trade_name'), 200) || companyLegalName;
    const businessNumber = combineBusinessNumbers(valuesFor(row, headerMap, 'business_number'));

    records.push({
      rowNumber,
      sourcePartnerCode: cleanCode(valueFor(row, headerMap, 'partner_code')),
      company_legal_name: companyLegalName,
      trading_name: tradingName,
      business_number: businessNumber,
      partner_type: 'Client',
      partner_class: 'Non Carrier',
      partner_roles: partnerRoles,
      country: normalizeCountry(valueFor(row, headerMap, 'country')),
      city: cleanLimited(valueFor(row, headerMap, 'city'), 100),
      address: cleanText(valueFor(row, headerMap, 'full_address')),
      tax_number: cleanLimited(valueFor(row, headerMap, 'tax_id'), 50),
      assigned_agent_name: cleanLimited(valueFor(row, headerMap, 'assigned_agent'), 200),
      payment_terms_as_supplier: '30 Days',
      payment_terms_as_client: '30 Days',
      currency: 'EUR',
      default_service_type: 'Sea',
      notes: 'Imported from partner Excel list',
      status: normalizeStatus(valueFor(row, headerMap, 'status')),
      rating: 3,
      credit_limit: null,
      contacts: contact,
      main_trades: [],
      bankDetails: [],
      deliveryAddresses: [],
      tradeMarketInfo: [],
      documents: [],
    });
  });

  return { records, skippedRows, warnings };
}

module.exports = {
  combineBusinessNumbers,
  cleanText,
  normalizeCountry,
  normalizePartnerImportRows,
  parseBoolean,
};
