const express = require('express');
const diagnosisController = require('../controllers/diagnosisController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/diagnoses/create', authenticate(['admin','therapist']), diagnosisController.createDiagnosis);
router.get('/diagnoses/get-all', authenticate(['admin','patient','therapist']), diagnosisController.getAllDiagnoses);
router.get('/diagnoses/get-by-id/:diagnosisId', authenticate(['admin','therapist','patient']), diagnosisController.getDiagnosisById);
router.put('/diagnoses/update/:diagnosisId', authenticate(['admin','therapist']), diagnosisController.updateDiagnosis);
router.delete('/diagnoses/delete/:diagnosisId', authenticate(['admin','therapist']), diagnosisController.deleteDiagnosis);

module.exports = router;
