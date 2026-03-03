const fs = require("fs");
const path = require("path");

/**
 * Get the CA certificate for database SSL connection
 * @returns {string|null} The CA certificate content or null if SSL is disabled
 */
function getCACertificate() {
  // Check if SSL is explicitly disabled
  const sslEnabled = process.env.DB_SSL_ENABLED !== "false";

  if (!sslEnabled) {
    return null;
  }

  // 1. Try path from environment variable
  const certFilePath = process.env.DB_SSL_CA_PATH;
  if (certFilePath) {
    const absolutePath = path.isAbsolute(certFilePath)
      ? certFilePath
      : path.resolve(process.cwd(), certFilePath);

    if (fs.existsSync(absolutePath)) {
      return fs.readFileSync(absolutePath, "utf8");
    }
  }

  // 2. Try default ca.pem in the current directory
  const localCaPath = path.join(__dirname, "ca.pem");
  if (fs.existsSync(localCaPath)) {
    return fs.readFileSync(localCaPath, "utf8");
  }

  // 3. Try certificate content from environment variable
  if (process.env.DB_SSL_CA) {
    return process.env.DB_SSL_CA;
  }

  return null;
}

module.exports = {
  getCACertificate,
};
