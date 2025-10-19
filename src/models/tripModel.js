const db = require('../config/database');

const buildTripEntity = (row) => ({
  id: row.id,
  destination: row.destination,
  country: row.country,
  startDate: row.start_date,
  endDate: row.end_date,
  notes: row.notes,
  createdAt: row.created_at,
  coverPhotoPath: row.cover_photo_path
});

const TripModel = {
  async findAll() {
    const { rows } = await db.query(
      `SELECT t.id,
              t.destination,
              t.country,
              t.start_date,
              t.end_date,
              t.notes,
              t.created_at,
              album_cover.cover_photo_path
         FROM trips t
    LEFT JOIN LATERAL (
              SELECT cover_photo_path
                FROM albums
               WHERE trip_id = t.id
                 AND cover_photo_path IS NOT NULL
               ORDER BY created_at DESC
               LIMIT 1
           ) AS album_cover ON TRUE
     ORDER BY t.created_at DESC`
    );
    return rows.map(buildTripEntity);
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT t.id,
              t.destination,
              t.country,
              t.start_date,
              t.end_date,
              t.notes,
              t.created_at,
              album_cover.cover_photo_path
         FROM trips t
    LEFT JOIN LATERAL (
              SELECT cover_photo_path
                FROM albums
               WHERE trip_id = t.id
                 AND cover_photo_path IS NOT NULL
               ORDER BY created_at DESC
               LIMIT 1
           ) AS album_cover ON TRUE
        WHERE t.id = $1`,
      [id]
    );
    return rows[0] ? buildTripEntity(rows[0]) : null;
  },

  async create({ destination, country, startDate, endDate, notes }) {
    const { rows } = await db.query(
      `INSERT INTO trips (destination, country, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, destination, country, start_date, end_date, notes, created_at,
                 NULL::VARCHAR AS cover_photo_path`,
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
       RETURNING id, destination, country, start_date, end_date, notes, created_at,
                 NULL::VARCHAR AS cover_photo_path`,
      [destination, country, startDate, endDate, notes, id]
    );
    if (!rows[0]) {
      return null;
    }
    return this.findById(rows[0].id);
  },

  async destroy(id) {
    const result = await db.query('DELETE FROM trips WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
};

module.exports = TripModel;
