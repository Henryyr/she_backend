const requiredEnvs = {
  // Database
  DB_HOST: 'string',
  DB_USER: 'string',
  DB_PASSWORD: 'string',
  DB_NAME: 'string',
  
  // Server
  PORT: 'number',
  NODE_ENV: ['development', 'production', 'test'],
  
  // Security
  JWT_SECRET: 'string',
  ALLOWED_ORIGINS: 'string', // comma separated URLs
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: 'string',
  CLOUDINARY_API_KEY: 'string',
  CLOUDINARY_SECRET: 'string'  // Diubah dari CLOUDINARY_API_SECRET
};

function validateEnv() {
  const missingEnvs = [];
  const invalidEnvs = [];

  Object.entries(requiredEnvs).forEach(([key, type]) => {
    const value = process.env[key];
    
    if (value === undefined) {
      missingEnvs.push(key);
      return;
    }

    if (Array.isArray(type)) {
      if (!type.includes(value)) {
        invalidEnvs.push(`${key} must be one of: ${type.join(', ')}`);
      }
    } else if (type === 'number') {
      if (isNaN(Number(value))) {
        invalidEnvs.push(`${key} must be a number`);
      }
    }
  });

  if (missingEnvs.length || invalidEnvs.length) {
    console.error('\n❌ Environment validation failed:');
    if (missingEnvs.length) {
      console.error('\nMissing variables:');
      missingEnvs.forEach(env => console.error(`- ${env}`));
    }
    if (invalidEnvs.length) {
      console.error('\nInvalid variables:');
      invalidEnvs.forEach(msg => console.error(`- ${msg}`));
    }
    console.error('\nPlease check your .env file\n');
    return false;
  }

  return true;
}

module.exports = validateEnv;
