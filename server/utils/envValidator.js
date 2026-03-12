const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'FRONTEND_URL'
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: Missing required environment variables:');
    missing.forEach(v => console.error(` - ${v}`));
    process.exit(1);
  } else if (missing.length > 0) {
    console.warn('⚠️  Warning: Missing environment variables in development:');
    missing.forEach(v => console.warn(` - ${v}`));
  } else {
    console.log('✅ Environment variables validated.');
  }
}
