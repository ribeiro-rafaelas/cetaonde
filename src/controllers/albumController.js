const AlbumModel = require('../models/albumModel');
const TripModel = require('../models/tripModel');

const AlbumController = {
  async create(req, res, next) {
    try {
      const tripId = Number(req.params.id);

      if (Number.isNaN(tripId)) {
        res.status(400).json({ success: false, errors: ['Identificador de viagem invalido.'] });
        return;
      }

      const trip = await TripModel.findById(tripId);
      if (!trip) {
        res.status(404).json({ success: false, errors: ['Viagem nao encontrada.'] });
        return;
      }

      const title = req.body.title?.trim();
      const description = req.body.description?.trim() || '';
      const errors = [];

      if (!title) {
        errors.push('Informe um titulo para o album.');
      }

      if (errors.length) {
        res.status(400).json({ success: false, errors });
        return;
      }

      const album = await AlbumModel.create({ tripId, title, description });
      res.status(201).json({ success: true, album: { ...album, photos: [] } });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AlbumController;
