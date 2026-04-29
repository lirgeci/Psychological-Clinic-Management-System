const express = require('express');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.post('/appointments/create', appointmentController.createAppointment);
router.get('/appointments/get-all', appointmentController.getAllAppointments);
router.get('/appointments/get-by-id/:appointmentId', appointmentController.getAppointmentById);
router.put('/appointments/update/:appointmentId', appointmentController.updateAppointment);
router.delete('/appointments/delete/:appointmentId', appointmentController.deleteAppointment);

module.exports = router;
