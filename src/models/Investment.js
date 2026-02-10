static async create(investmentData) {
  const { userId, planId, planName, amount, dailyReturn, durationDays } = investmentData;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Insert into investments table
    const result = await client.query(
      'INSERT INTO investments (user_id, plan_id, plan_name, amount, daily_return, start_date, end_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [userId, planId, planName, amount, dailyReturn, startDate, endDate, 'active']
    );

    // 2️⃣ Insert transaction record
    await client.query(
      'INSERT INTO transactions (user_id, type, amount, status, reference_id, description) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, 'investment', amount, 'active', result.rows[0].id, 'Investment in ' + planName]
    );

    await client.query('COMMIT');

    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
