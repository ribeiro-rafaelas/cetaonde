const db = require('../config/database');

const buildTripEntity = (row) => ({
  id: row.id,
  destination: row.destination,
  country: row.country,
  startDate: row.start_date,
  endDate: row.end_date,
  notes: row.notes,
  createdAt: row.created_at
});

const TripModel = {
  async findAll() {
    const { rows } = await db.query(
      'SELECT id, destination, country, start_date, end_date, notes, created_at FROM trips ORDER BY created_at DESC'
    );
    return rows.map(buildTripEntity);
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, destination, country, start_date, end_date, notes, created_at FROM trips WHERE id = $1',
      [id]
    );
    return rows[0] ? buildTripEntity(rows[0]) : null;
  },

  async create({ destination, country, startDate, endDate, notes }) {
    const { rows } = await db.query(
      `INSERT INTO trips (destination, country, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, destination, country, start_date, end_date, notes, created_at`,
      [destination, country, startDate, endDate, notes]
    );
    return buildTripEntity(rows[0]);
  },

  async update(id, { destination, country, startDate, endDate, notes }) {
    const { rows } = await db.query(
      `UPDATE trips
         SET destination = $1,
             country = $2,
             start_date = $3,
             end_date = $4,
             notes = $5
       WHERE id = $6
       RETURNING id, destination, country, start_date, end_date, notes, created_at`,
      [destination, country, startDate, endDate, notes, id]
    );
    return rows[0] ? buildTripEntity(rows[0]) : null;
  },

  async destroy(id) {
    const result = await db.query('DELETE FROM trips WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
};

module.exports = TripModel;
