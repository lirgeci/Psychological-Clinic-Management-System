const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/appointments/create', authenticate(['admin','patient']), appointmentController.createAppointment);
router.get('/appointments/get-all', authenticate(['admin']), appointmentController.getAllAppointments);
router.get('/appointments/get-by-id/:appointmentId', authenticate(['admin','therapist','patient']), appointmentController.getAppointmentById);
router.put('/appointments/update/:appointmentId', authenticate(['admin','therapist']), appointmentController.updateAppointment);
router.delete('/appointments/delete/:appointmentId', authenticate(['admin']), appointmentController.deleteAppointment);

module.exports = router;
