const express = require('express');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.post('/patients/create', patientController.createPatient);
router.get('/patients/get-all', patientController.getAllPatients);
router.get('/patients/get-by-id/:patientId', patientController.getPatientById);
router.put('/patients/update/:patientId', patientController.updatePatient);
router.delete('/patients/delete/:patientId', patientController.deletePatient);
router.get('/patients/:patientId/appointments', patientController.getPatientAppointments);

module.exports = router;