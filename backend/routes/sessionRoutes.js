const express = require('express');
const sessionController = require('../controllers/sessionController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/sessions/get-all', authenticate(['admin','therapist','patient']), sessionController.getAllSessions);
router.get('/sessions/get-by-id/:sessionId', authenticate(['admin','therapist','patient']), sessionController.getSessionById);
router.post('/sessions/create', authenticate(['therapist']), sessionController.createSession);
router.put('/sessions/update/:sessionId', authenticate(['therapist']), sessionController.updateSession);
router.delete('/sessions/delete/:sessionId', authenticate(['admin']), sessionController.deleteSession);

module.exports = router;
