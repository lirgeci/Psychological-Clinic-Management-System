
const express = require('express');
const therapistController = require('../controllers/therapistController');

const router = express.Router();

router.post('/therapists/create', therapistController.createTherapist);
router.get('/therapists/get-all', therapistController.getAllTherapists);
router.get('/therapists/get-by-id/:therapistId', therapistController.getTherapistById);
router.put('/therapists/update/:therapistId', therapistController.updateTherapist);
router.delete('/therapists/delete/:therapistId', therapistController.deleteTherapist);
router.get('/therapists/:therapistId/appointments', therapistController.getTherapistAppointments);

module.exports = router;