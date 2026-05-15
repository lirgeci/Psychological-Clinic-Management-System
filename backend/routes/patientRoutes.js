const express = require('express');
const patientController = require('../controllers/patientController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/patients/create', authenticate(['admin']), patientController.createPatient);
router.get('/patients/get-all', authenticate(['admin','patient','therapist']), patientController.getAllPatients);
router.get('/patients/get-by-id/:patientId', authenticate(['admin','therapist','patient']), patientController.getPatientById);
router.put('/patients/update/:patientId', authenticate(['admin','patient']), patientController.updatePatient);
router.delete('/patients/delete/:patientId', authenticate(['admin']), patientController.deletePatient);
router.get('/patients/:patientId/appointments', authenticate(['admin','therapist','patient']), patientController.getPatientAppointments);

module.exports = router;