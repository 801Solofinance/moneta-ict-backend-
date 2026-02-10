const db = require('../config/database');

class Deposit {
  static async create(depositData) {
    const { userId, amount, currency, proofUrl } = depositData;
    const query = `INSERT INTO deposits (user_id, amount, currency, proof_url, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *`;
    const result = await db.query(query, [userId, amount, currency, proofUrl]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT d.*, u.name as user_name, u.email as user_email FROM deposits d JOIN users u ON d.user_id = u.id WHERE d.id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50) {
    const result = await db.query('SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [userId, limit]);
    return result.rows;
  }

  static async getPending() {
    const query = `SELECT d.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM deposits d JOIN users u ON d.user_id = u.id WHERE d.status = 'pending' ORDER BY d.created_at ASC`;
    const result = await db.query(query);
    return result.rows;
  }

  static async approve(depositId, adminId, adminNotes = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const depositResult = await client.query('SELECT * FROM deposits WHERE id = $1', [depositId]);
      const deposit = depositResult.rows[0];
      if (!deposit || deposit.status !== 'pending') throw new Error('Invalid deposit');
      
      await client.query('UPDATE deposits SET status = $1, approved_by = $2, admin_notes = $3, approved_at = NOW() WHERE id = $4', ['approved', adminId, adminNotes, depositId]);
      await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [deposit.amount, deposit.user_id]);
      await client.query('INSERT INTO transactions (user_id, type, amount, status, reference_id) VALUES ($1, $2, $3, $4, $5)', [deposit.user_id, 'deposit', deposit.amount, 'approved', depositId]);
      
      await client.query('COMMIT');
      return deposit;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async reject(depositId, adminId, adminNotes) {
    const result = await db.query('UPDATE deposits SET status = $1, approved_by = $2, admin_notes = $3, approved_at = NOW() WHERE id = $4 RETURNING *', ['rejected', adminId, adminNotes, depositId]);
    return result.rows[0];
  }
}

module.exports = Deposit;
