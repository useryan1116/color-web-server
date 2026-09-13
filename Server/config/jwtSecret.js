const DEVELOPMENT_SECRET = 'your-secret-key';

function getJwtSecret(env = process.env) {
  const secret = env.JWT_SECRET;
  if (env.NODE_ENV === 'production' && (!secret || Buffer.byteLength(secret) < 32)) {
    throw new Error('JWT_SECRET must be at least 32 bytes in production');
  }
  return secret || DEVELOPMENT_SECRET;
}

module.exports = { getJwtSecret };
