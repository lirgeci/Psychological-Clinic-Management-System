
const express = require('express');
const therapistController = require('../controllers/therapistController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/therapists/create', authenticate(['admin']), therapistController.createTherapist);
router.get('/therapists/get-all', authenticate(['admin','therapist','patient']), therapistController.getAllTherapists);
router.get('/therapists/get-by-id/:therapistId', authenticate(['admin','therapist']), therapistController.getTherapistById);
router.put('/therapists/update/:therapistId', authenticate(['admin','therapist']), therapistController.updateTherapist);
router.delete('/therapists/delete/:therapistId', authenticate(['admin']), therapistController.deleteTherapist);
router.get('/therapists/:therapistId/appointments', authenticate(['admin','therapist']), therapistController.getTherapistAppointments);

module.exports = router;