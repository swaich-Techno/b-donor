function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error("JWT_SECRET environment variable is required.");
    error.status = 500;
    throw error;
  }
  return secret;
}

module.exports = { getJwtSecret };
