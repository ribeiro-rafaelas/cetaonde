const express = require('express');
const TripController = require('../controllers/tripController');

const router = express.Router();

router.get('/', TripController.listTrips);
router.get('/trip/new', TripController.renderCreateForm);
router.get('/trip/:id', TripController.showTrip);
router.post('/trip', TripController.createTrip);
router.put('/trip/:id', TripController.updateTrip);
router.delete('/trip/:id', TripController.deleteTrip);

module.exports = router;
