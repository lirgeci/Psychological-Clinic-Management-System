const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/feedback/create', authenticate(['patient']), feedbackController.createFeedback);
router.get('/feedback/get-all', authenticate(['admin']), feedbackController.getAllFeedback);
router.get('/feedback/my-feedback', authenticate(['therapist']), feedbackController.getMyFeedback);
router.get('/feedback/get-by-id/:id', authenticate(['admin', 'therapist', 'patient']), feedbackController.getFeedbackById);
router.delete('/feedback/delete/:id', authenticate(['admin']), feedbackController.deleteFeedback);

module.exports = router;