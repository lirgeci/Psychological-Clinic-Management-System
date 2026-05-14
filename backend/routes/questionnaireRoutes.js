const express = require('express');
const questionnaireController = require('../controllers/questionnaireController');

const router = express.Router();

router.post('/questionnaires/create', questionnaireController.createQuestionnaire);
router.get('/questionnaires/get-all', questionnaireController.getAllQuestionnaires);
router.get('/questionnaires/get-by-id/:questionnaireId', questionnaireController.getQuestionnaireById);
router.put('/questionnaires/update/:questionnaireId', questionnaireController.updateQuestionnaire);
router.delete('/questionnaires/delete/:questionnaireId', questionnaireController.deleteQuestionnaire);

module.exports = router;