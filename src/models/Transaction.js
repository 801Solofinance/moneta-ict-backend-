const db = require('../config/database');

class Transaction {
  static async create(transactionData) {
    const { userId, type, amount, status, referenceId, description } = transactionData;
    const query = `INSERT INTO transactions (user_id, type, amount, status, reference_id, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await db.query(query, [userId, type, amount, status, referenceId, description]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50) {
    const result = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [userId, limit]);
    return result.rows;
  }

  static async getAll(limit = 100) {
    const query = `SELECT t.*, u.name as user_name, u.email as user_email FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT $1`;
    const result = await db.query(query, [limit]);
    return result.rows;
  }
}

module.exports = Transaction;
