require("dotenv").config();
const mysql = require("mysql2/promise");
const { getCACertificate } = require("./certificate");

let mysqlPool = null;

function getMysqlPool() {
  if (!mysqlPool) {
    const caCertificate = getCACertificate();

    // Build connection options
    const connectionOptions = {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "prospine",
      password: process.env.DB_PASS || "1234",
      database: process.env.DB_NAME || "prospine",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      charset: 'utf8mb4',
      // Disable ONLY_FULL_GROUP_BY for compatibility
      sessionVariables: {
        sql_mode: 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'
      }
    };

    // Add SSL configuration only if certificate is available
    if (caCertificate) {
      console.log(`🔒 Connecting to ${connectionOptions.host}:${connectionOptions.port} with SSL`);
      connectionOptions.ssl = {
        ca: caCertificate,
        rejectUnauthorized: false,
      };
    } else {
      console.log(`🔓 Connecting to ${connectionOptions.host}:${connectionOptions.port} without SSL`);
    }

    mysqlPool = mysql.createPool(connectionOptions);
  }
  return mysqlPool;
}

async function checkConnection() {
  try {
    const connection = await getMysqlPool().getConnection();
    await connection.ping();
    connection.release();
    console.log("✅ MySQL connected successfully");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1); // optional: stop server if DB fails
  }
}

const pool = {
  async query(sql, params) {
    const p = getMysqlPool();
    return await p.query(sql, params);
  },
  async execute(sql, params) {
    const p = getMysqlPool();
    return await p.execute(sql, params);
  },
  async getConnection() {
    const p = getMysqlPool();
    return await p.getConnection();
  },
  async queryRemote(sql, params) {
    return await this.query(sql, params);
  },
  queryContext: {
    run: (context, next) => next(),
  },
};

module.exports = {
  ...pool,
  checkConnection,
};
