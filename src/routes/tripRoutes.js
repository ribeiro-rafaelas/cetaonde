const express = require('express');
const TripController = require('../controllers/tripController');
const AlbumController = require('../controllers/albumController');
const PhotoController = require('../controllers/photoController');
const { singlePhotoUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/', TripController.listTrips);
router.get('/trip/new', TripController.renderCreateForm);
router.get('/trip/:id', TripController.showTrip);
router.post('/trip', TripController.createTrip);
router.put('/trip/:id', TripController.updateTrip);
router.delete('/trip/:id', TripController.deleteTrip);

router.post('/trip/:id/albums', AlbumController.create);
router.post('/trip/:tripId/albums/:albumId/photos', singlePhotoUpload, PhotoController.upload);

module.exports = router;
