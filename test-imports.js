const imports = [
  './server/routes/menu.js',
  './server/routes/orders.js',
  './server/routes/ai.js',
  './server/routes/admin.js',
  './server/routes/auth.js',
  './server/routes/customers.js',
  './server/routes/analytics.js',
  './server/routes/cart.js',
  './server/routes/payments.js',
  './server/routes/delivery.js',
  './server/routes/catering.js',
  './server/routes/reservations.js',
  './server/routes/webhooks.js',
  './server/config.js',
  './server/utils/database.js',
  './server/utils/cleanup.js',
  './server/middleware/tenant.js',
  './server/middleware/auth.js',
  './server/utils/envValidator.js'
];

async function test() {
  for (const m of imports) {
    try {
      process.stdout.write(`Testing ${m}... `);
      await import(m);
      console.log(`✅ OK`);
    } catch (e) {
      console.log(`❌ FAILED: ${e.code} - ${e.message}`);
      if (e.stack) console.error(e.stack);
    }
  }
}
test();
