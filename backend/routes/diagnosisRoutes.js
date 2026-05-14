const express = require('express');
const diagnosisController = require('../controllers/diagnosisController');

const router = express.Router();

router.post('/diagnoses/create', diagnosisController.createDiagnosis);
router.get('/diagnoses/get-all', diagnosisController.getAllDiagnoses);
router.get('/diagnoses/get-by-id/:diagnosisId', diagnosisController.getDiagnosisById);
router.put('/diagnoses/update/:diagnosisId', diagnosisController.updateDiagnosis);
router.delete('/diagnoses/delete/:diagnosisId', diagnosisController.deleteDiagnosis);

module.exports = router;
