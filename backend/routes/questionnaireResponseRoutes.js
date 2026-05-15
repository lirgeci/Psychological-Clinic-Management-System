const express = require('express');
const questionnaireResponseController = require('../controllers/questionnaireResponseController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/questionnaire-responses/create', authenticate(['patient']), questionnaireResponseController.createQuestionnaireResponse);
router.get('/questionnaire-responses/get-all', authenticate(['admin','patient','therapist']), questionnaireResponseController.getAllQuestionnaireResponses);
router.get('/questionnaire-responses/get-by-id/:responseId', authenticate(['admin','therapist','patient']), questionnaireResponseController.getQuestionnaireResponseById);
router.put('/questionnaire-responses/update/:responseId', authenticate(['admin']), questionnaireResponseController.updateQuestionnaireResponse);
router.delete('/questionnaire-responses/delete/:responseId', authenticate(['admin']), questionnaireResponseController.deleteQuestionnaireResponse);

module.exports = router;
