const db = require('../config/database');

const buildPhotoEntity = (row) => ({
  id: row.id,
  albumId: row.album_id,
  tripId: row.trip_id,
  filePath: row.file_path,
  caption: row.caption,
  createdAt: row.created_at
});

const PhotoModel = {
  async create({ albumId, tripId, filePath, caption }) {
    const { rows } = await db.query(
      `INSERT INTO photos (album_id, trip_id, file_path, caption)
       VALUES ($1, $2, $3, $4)
       RETURNING id, album_id, trip_id, file_path, caption, created_at`,
      [albumId, tripId, filePath, caption]
    );
    return buildPhotoEntity(rows[0]);
  },

  async findByAlbumIds(albumIds) {
    if (!albumIds?.length) {
      return [];
    }

    const { rows } = await db.query(
      `SELECT id, album_id, trip_id, file_path, caption, created_at
         FROM photos
        WHERE album_id = ANY($1::int[])
        ORDER BY created_at DESC`,
      [albumIds]
    );

    return rows.map(buildPhotoEntity);
  }
};

module.exports = PhotoModel;
