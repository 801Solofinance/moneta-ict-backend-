const db = require('../config/database');

class Withdrawal {
  static async create(withdrawalData) {
    const { userId, amount, currency, bankName, accountNumber, accountType } = withdrawalData;
    const query = `INSERT INTO withdrawals (user_id, amount, currency, bank_name, account_number, account_type, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`;
    const result = await db.query(query, [userId, amount, currency, bankName, accountNumber, accountType]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50) {
    const result = await db.query('SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [userId, limit]);
    return result.rows;
  }

  static async getPending() {
    const query = `SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM withdrawals w JOIN users u ON w.user_id = u.id WHERE w.status = 'pending' ORDER BY w.created_at ASC`;
    const result = await db.query(query);
    return result.rows;
  }

  static async approve(withdrawalId, adminId, adminNotes = null) {
    const result = await db.query('UPDATE withdrawals SET status = $1, approved_by = $2, admin_notes = $3, approved_at = NOW() WHERE id = $4 RETURNING *', ['approved', adminId, adminNotes, withdrawalId]);
    if (result.rows[0]) {
      await db.query('INSERT INTO transactions (user_id, type, amount, status, reference_id) VALUES ($1, $2, $3, $4, $5)', [result.rows[0].user_id, 'withdrawal', result.rows[0].amount, 'approved', withdrawalId]);
    }
    return result.rows[0];
  }

  static async reject(withdrawalId, adminId, adminNotes) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const withdrawalResult = await client.query('SELECT * FROM withdrawals WHERE id = $1', [withdrawalId]);
      const withdrawal = withdrawalResult.rows[0];
      if (!withdrawal || withdrawal.status !== 'pending') throw new Error('Invalid withdrawal');
      
      await client.query('UPDATE withdrawals SET status = $1, approved_by = $2, admin_notes = $3, approved_at = NOW() WHERE id = $4', ['rejected', adminId, adminNotes, withdrawalId]);
      await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [withdrawal.amount, withdrawal.user_id]);
      
      await client.query('COMMIT');
      return withdrawal;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Withdrawal;
