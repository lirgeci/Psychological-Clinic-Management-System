const express = require('express');
const questionnaireResponseController = require('../controllers/questionnaireResponseController');

const router = express.Router();

router.post('/questionnaire-responses/create', questionnaireResponseController.createQuestionnaireResponse);
router.get('/questionnaire-responses/get-all', questionnaireResponseController.getAllQuestionnaireResponses);
router.get('/questionnaire-responses/get-by-id/:responseId', questionnaireResponseController.getQuestionnaireResponseById);
router.put('/questionnaire-responses/update/:responseId', questionnaireResponseController.updateQuestionnaireResponse);
router.delete('/questionnaire-responses/delete/:responseId', questionnaireResponseController.deleteQuestionnaireResponse);

module.exports = router;
