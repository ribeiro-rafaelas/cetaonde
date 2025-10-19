const AlbumModel = require('../models/albumModel');
const PhotoModel = require('../models/photoModel');

const PhotoController = {
  async upload(req, res, next) {
    try {
      const tripId = Number(req.params.tripId);
      const albumId = Number(req.params.albumId);

      if (Number.isNaN(tripId) || Number.isNaN(albumId)) {
        res.status(400).json({
          success: false,
          errors: ['Identificadores informados sao invalidos.']
        });
        return;
      }

      const album = await AlbumModel.findById(albumId);
      if (!album || album.tripId !== tripId) {
        res.status(404).json({ success: false, errors: ['Album nao encontrado.'] });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, errors: ['Envie uma imagem valida.'] });
        return;
      }

      const caption = req.body.caption?.trim() || '';
      const filePath = `/uploads/${req.file.filename}`;

      const photo = await PhotoModel.create({ albumId, tripId, filePath, caption });

      let updatedAlbum = album;
      if (!album.coverPhotoPath) {
        updatedAlbum = await AlbumModel.updateCoverPhoto(albumId, filePath);
      }

      res.status(201).json({
        success: true,
        photo,
        album: updatedAlbum
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PhotoController;
