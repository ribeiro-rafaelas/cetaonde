const db = require('../config/database');

const buildAlbumEntity = (row) => ({
  id: row.id,
  tripId: row.trip_id,
  title: row.title,
  description: row.description,
  coverPhotoPath: row.cover_photo_path,
  createdAt: row.created_at
});

const AlbumModel = {
  async create({ tripId, title, description }) {
    const { rows } = await db.query(
      `INSERT INTO albums (trip_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING id, trip_id, title, description, cover_photo_path, created_at`,
      [tripId, title, description]
    );
    return buildAlbumEntity(rows[0]);
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT id, trip_id, title, description, cover_photo_path, created_at
         FROM albums
        WHERE id = $1`,
      [id]
    );
    return rows[0] ? buildAlbumEntity(rows[0]) : null;
  },

  async findByTripId(tripId) {
    const { rows } = await db.query(
      `SELECT id, trip_id, title, description, cover_photo_path, created_at
         FROM albums
        WHERE trip_id = $1
        ORDER BY created_at DESC`,
      [tripId]
    );
    return rows.map(buildAlbumEntity);
  },

  async updateCoverPhoto(albumId, coverPhotoPath) {
    const { rows } = await db.query(
      `UPDATE albums
          SET cover_photo_path = $1
        WHERE id = $2
        RETURNING id, trip_id, title, description, cover_photo_path, created_at`,
      [coverPhotoPath, albumId]
    );
    return rows[0] ? buildAlbumEntity(rows[0]) : null;
  }
};

module.exports = AlbumModel;
