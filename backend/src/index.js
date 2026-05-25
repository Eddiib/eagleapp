require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyToken, requireModuleAccess } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRouter       = require('./routes/auth');
const partnersRouter   = require('./routes/partners');
const servicesRouter   = require('./routes/services');
const bookingsRouter   = require('./routes/bookings');
const quotationsRouter = require('./routes/quotations');
const salesLeadsRouter = require('./routes/salesLeads');
const employeesRouter  = require('./routes/employees');
const equipmentRouter  = require('./routes/equipment');
const costControlRouter= require('./routes/costControl');
const invoicesRouter   = require('./routes/invoices');
const pricingRouter    = require('./routes/pricing');
const bookingAttachmentsRouter = require('./routes/bookingAttachments');
const exchangeRatesRouter     = require('./routes/exchangeRates');
const auditLogRouter          = require('./routes/auditLog');
const companySettingsRouter   = require('./routes/companySettings');
const brandingRouter          = require('./routes/branding');
const portsRouter             = require('./routes/ports');

const PORT = Number(process.env.PORT) || 3001;

function salesLeadsModule(req) {
  return req.path.includes('/minutes') ? 'meeting-minutes' : 'sales-leads';
}

function pricingModule(req) {
  if (req.path.startsWith('/contracts')) return 'buy-rates-contracts';
  if (req.path.startsWith('/models')) return 'pricing-models';
  return 'available-loads';
}

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Public routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/branding', brandingRouter);

  // Protected routes — require valid JWT plus module permissions.
  app.use('/api/partners',     verifyToken, requireModuleAccess('partners-management'), partnersRouter);
  app.use('/api/services',     verifyToken, requireModuleAccess('service-management'),  servicesRouter);
  app.use('/api/bookings/:bookingId/attachments', verifyToken, requireModuleAccess('booking-sheet'), bookingAttachmentsRouter);
  app.use('/api/bookings',     verifyToken, requireModuleAccess('booking-sheet'),       bookingsRouter);
  app.use('/api/quotations',   verifyToken, requireModuleAccess('quotation-desk'),      quotationsRouter);
  app.use('/api/sales-leads',  verifyToken, requireModuleAccess(salesLeadsModule),      salesLeadsRouter);
  app.use('/api/employees',    verifyToken, requireModuleAccess('employees'),           employeesRouter);
  app.use('/api/equipment',    verifyToken, requireModuleAccess('equipment'),           equipmentRouter);
  app.use('/api/cost-control', verifyToken, requireModuleAccess('cost-control'),        costControlRouter);
  app.use('/api/invoices',     verifyToken, requireModuleAccess('invoicing'),           invoicesRouter);
  app.use('/api/pricing',      verifyToken, requireModuleAccess(pricingModule),         pricingRouter);
  app.use('/api/exchange-rates', verifyToken, requireModuleAccess('forex-management'),  exchangeRatesRouter);
  app.use('/api/audit-log',      verifyToken, requireModuleAccess('audit-log'),         auditLogRouter);
  app.use('/api/company-settings', verifyToken, companySettingsRouter);
  // Ports: GET is open to any signed-in user (powers booking POL/POD pickers);
  // mutations enforce admin-only inside the router.
  app.use('/api/ports',            verifyToken, portsRouter);

  // 404 + central error handler (must be last)
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

function startServer(port = PORT) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Eagle API running on http://localhost:${port}`);
  });
  return { app, server };
}

let runningServer;
if (require.main === module) {
  runningServer = startServer();
}

module.exports = { createApp, startServer };
