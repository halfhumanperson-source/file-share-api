const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://koyeb-adm:npg_4wqWoTZIz8Ob@ep-mute-butterfly-ag9zeaud.c-2.eu-central-1.pg.koyeb.app/koyebdb';

async function initDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL');

    // Create files table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(255) PRIMARY KEY,
        file_data JSONB NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database initialized');
    await client.end();
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    await client.end();
    process.exit(1);
  }
}

initDatabase();
