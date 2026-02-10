require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (name, email, phone, country, password_hash, referral_code, role, balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@moneta-ict.com', '+573001234567', 'CO', passwordHash, 'ADMIN1', 'admin', 0]);
    
    console.log('✅ Admin user created');
    console.log('📧 Email: admin@moneta-ict.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  CHANGE PASSWORD IN PRODUCTION!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
