const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    const { name, email, phone, country, password, referralCode, referredBy } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (name, email, phone, country, password_hash, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, phone, country, referral_code, balance, role, created_at`;
    const result = await db.query(query, [name, email, phone, country, passwordHash, referralCode, referredBy]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT id, name, email, phone, country, referral_code, referred_by, balance, role, status, created_at FROM users WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateBalance(userId, amount) {
    const result = await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance', [amount, userId]);
    return result.rows[0];
  }

  static async updateProfile(userId, updates) {
    const { name, phone } = updates;
    const query = `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, name, email, phone, country, referral_code, balance, role`;
    const result = await db.query(query, [name, phone, userId]);
    return result.rows[0];
  }

  static async getReferrals(referralCode) {
    const result = await db.query('SELECT id, name, email, created_at FROM users WHERE referred_by = $1', [referralCode]);
    return result.rows;
  }

  static async emailExists(email) {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  }

  static async getAll(limit = 50, offset = 0) {
    const query = `SELECT id, name, email, phone, country, balance, role, status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }
}

module.exports = User;
