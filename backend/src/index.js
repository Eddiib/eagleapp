require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyToken, requireRole } = require('./middleware/auth');
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

const PORT = Number(process.env.PORT) || 3001;

// Any authenticated user can read (GET). Writes are restricted to the listed roles.
// admin and manager always have write access implicitly via inclusion in each list.
function requireWriteRole(...roles) {
  return (req, res, next) => {
    if (req.method === 'GET') return next();
    return requireRole(...roles)(req, res, next);
  };
}

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Public routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/branding', brandingRouter);

  // Protected routes — require valid JWT. Writes additionally require matching role.
  app.use('/api/partners',     verifyToken, requireWriteRole('admin','manager','sales'),            partnersRouter);
  app.use('/api/services',     verifyToken, requireWriteRole('admin','manager'),                    servicesRouter);
  app.use('/api/bookings/:bookingId/attachments', verifyToken, requireWriteRole('admin','manager','sales','operations'), bookingAttachmentsRouter);
  app.use('/api/bookings',     verifyToken, requireWriteRole('admin','manager','sales','operations'), bookingsRouter);
  app.use('/api/quotations',   verifyToken, requireWriteRole('admin','manager','sales'),            quotationsRouter);
  app.use('/api/sales-leads',  verifyToken, requireWriteRole('admin','manager','sales'),            salesLeadsRouter);
  app.use('/api/employees',    verifyToken, requireWriteRole('admin','manager'),                    employeesRouter);
  app.use('/api/equipment',    verifyToken, requireWriteRole('admin','manager','operations'),       equipmentRouter);
  app.use('/api/cost-control', verifyToken, requireWriteRole('admin','manager','operations','accounting'), costControlRouter);
  app.use('/api/invoices',     verifyToken, requireWriteRole('admin','manager','accounting'),       invoicesRouter);
  app.use('/api/pricing',      verifyToken, requireWriteRole('admin','manager','sales','operations'), pricingRouter);
  app.use('/api/exchange-rates', verifyToken, requireWriteRole('admin','manager','accounting'),       exchangeRatesRouter);
  app.use('/api/audit-log',      verifyToken, requireRole('admin'),                                    auditLogRouter);
  app.use('/api/company-settings', verifyToken,                                                          companySettingsRouter);

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

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
