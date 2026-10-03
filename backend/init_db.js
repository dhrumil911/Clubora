import pg from 'pg';
import { runMigrationsAndSeed } from './database/seed.js';

async function main() {
  const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'priyansh6',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL authentication successful!');
    const res = await client.query("SELECT datname FROM pg_database WHERE datname = 'Clubora'");
    if (res.rows.length === 0) {
      console.log("🔨 Database 'Clubora' does not exist. Creating database 'Clubora'...");
      await client.query('CREATE DATABASE "Clubora"');
      console.log("✅ Database 'Clubora' created successfully!");
    } else {
      console.log("✅ Database 'Clubora' already exists.");
    }
    await client.end();

    console.log("🌱 Running schema migrations and seeding data...");
    await runMigrationsAndSeed();
    console.log("🎉 Complete setup finished cleanly!");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
