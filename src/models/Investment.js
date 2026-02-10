const db = require('../config/database');

class Investment {
  static async create(investmentData) {
    const { userId, planId, planName, amount, dailyReturn, durationDays } = investmentData;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, userId]);
      const query = `INSERT INTO investments (user_id, plan_id, plan_name, amount, daily_return, duration_days, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') RETURNING *`;
      const result = await client.query(query, [userId, planId, planName, amount, dailyReturn, durationDays, startDate, endDate]);
      await client.query('INSERT INTO transactions (user_id, type, amount, status, reference_id, description) VALUES ($1, $2, $3, $4, $5, $6)', [userId, 'investment', amount, 'active', result.rows[0].id, \`Investment in \${planName}\`]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByUserId(userId) {
    const result = await db.query('SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  }

  static async getActive(userId) {
    const result = await db.query('SELECT * FROM investments WHERE user_id = $1 AND status = $2 ORDER BY end_date ASC', [userId, 'active']);
    return result.rows;
  }
}

module.exports = Investment;
