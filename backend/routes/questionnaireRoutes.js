const express = require('express');
const questionnaireController = require('../controllers/questionnaireController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/questionnaires/create', authenticate(['admin']), questionnaireController.createQuestionnaire);
router.get('/questionnaires/get-all', authenticate(['admin','therapist','patient']), questionnaireController.getAllQuestionnaires);
router.get('/questionnaires/get-by-id/:questionnaireId', authenticate(['admin','therapist','patient']), questionnaireController.getQuestionnaireById);
router.put('/questionnaires/update/:questionnaireId', authenticate(['admin']), questionnaireController.updateQuestionnaire);
router.delete('/questionnaires/delete/:questionnaireId', authenticate(['admin']), questionnaireController.deleteQuestionnaire);

module.exports = router;