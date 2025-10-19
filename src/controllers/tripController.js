const TripModel = require('../models/tripModel');

const normalizePayload = (payload = {}) => ({
  destination: payload.destination?.trim(),
  country: payload.country?.trim(),
  startDate: payload.start_date || payload.startDate,
  endDate: payload.end_date || payload.endDate,
  notes: payload.notes?.trim() || ''
});

const validateTrip = ({ destination, country, startDate, endDate }) => {
  const errors = [];

  if (!destination) {
    errors.push('O destino é obrigatório.');
  }

  if (!country) {
    errors.push('O país é obrigatório.');
  }

  if (!startDate) {
    errors.push('A data de início é obrigatória.');
  }

  if (!endDate) {
    errors.push('A data de término é obrigatória.');
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      errors.push('Datas inválidas.');
    } else if (start > end) {
      errors.push('A data de início não pode ser posterior à data de término.');
    }
  }

  return errors;
};

const TripController = {
  async listTrips(req, res, next) {
    try {
      const trips = await TripModel.findAll();
      res.render('index', { trips });
    } catch (error) {
      next(error);
    }
  },

  async showTrip(req, res, next) {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) {
        res.status(404).render('404');
        return;
      }
      res.render('trip_details', { trip });
    } catch (error) {
      next(error);
    }
  },

  renderCreateForm(req, res) {
    res.render('add_trip', { errors: [], formData: {} });
  },

  async createTrip(req, res, next) {
    try {
      const formData = normalizePayload(req.body);
      const errors = validateTrip(formData);

      if (errors.length > 0) {
        res.status(400).render('add_trip', { errors, formData });
        return;
      }

      await TripModel.create(formData);
      res.redirect('/');
    } catch (error) {
      next(error);
    }
  },

  async updateTrip(req, res, next) {
    try {
      const formData = normalizePayload(req.body);
      const errors = validateTrip(formData);

      if (errors.length > 0) {
        res.status(400).json({ success: false, errors });
        return;
      }

      const updated = await TripModel.update(req.params.id, formData);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Viagem não encontrada.' });
        return;
      }

      res.json({ success: true, trip: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteTrip(req, res, next) {
    try {
      const deleted = await TripModel.destroy(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Viagem não encontrada.' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = TripController;
