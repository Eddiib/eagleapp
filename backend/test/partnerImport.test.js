const test = require('node:test');
const assert = require('node:assert/strict');

const {
  combineBusinessNumbers,
  normalizeCountry,
  normalizePartnerImportRows,
} = require('../src/lib/partnerImport');

test('combineBusinessNumbers treats duplicate columns as one field', () => {
  assert.equal(combineBusinessNumbers(['601215355', '810845935']), '601215355 / 810845935');
  assert.equal(combineBusinessNumbers(['810052093', '810052093']), '810052093');
  assert.equal(combineBusinessNumbers([null, '/////']), '');
  assert.equal(combineBusinessNumbers([' 601589859 ', null]), '601589859');
});

test('normalizeCountry maps import country names to app country codes', () => {
  assert.equal(normalizeCountry('KOSOVA'), 'XK');
  assert.equal(normalizeCountry('SHQIPËRIA'), 'AL');
  assert.equal(normalizeCountry('NORTH MACEDONIA'), 'MK');
  assert.equal(normalizeCountry('UNITED STATES'), 'US');
});

test('normalizePartnerImportRows maps the Eagle export shape', () => {
  const rows = [
    [
      'Partner Code',
      'Business Legal Name',
      'Business Trade Name',
      'Full Address',
      'City',
      'Assigned Agent',
      'Business Number',
      'Buyer',
      'Seller',
      'Country',
      'Tax ID',
      'Phone',
      'Email',
      'Status',
      'Business Number',
    ],
    [
      '1002',
      'MEDCARGO KOSOVO L.L.C',
      'MSC KOSOVA',
      'Rruga Tirana',
      'Prishtine',
      'Bujar Kryeziu',
      '601215355',
      true,
      true,
      'KOSOVA',
      '330258336',
      '+38338222894',
      'XK769-contact@msc.com',
      false,
      '810845935',
    ],
  ];

  const { records, skippedRows, warnings } = normalizePartnerImportRows(rows);
  assert.equal(skippedRows.length, 0);
  assert.equal(warnings.length, 0);
  assert.equal(records.length, 1);
  assert.equal(records[0].sourcePartnerCode, '1002');
  assert.equal(records[0].trading_name, 'MSC KOSOVA');
  assert.equal(records[0].business_number, '601215355 / 810845935');
  assert.deepEqual(records[0].partner_roles, ['Buyer', 'Seller']);
  assert.equal(records[0].country, 'XK');
  assert.equal(records[0].status, 'Active');
  assert.equal(records[0].contacts[0].email, 'XK769-contact@msc.com');
});
