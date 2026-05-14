const express = require('express');
const sessionController = require('../controllers/sessionController');

const router = express.Router();

router.get('/sessions/get-all', sessionController.getAllSessions);
router.get('/sessions/get-by-id/:sessionId', sessionController.getSessionById);
router.post('/sessions/create', sessionController.createSession);
router.put('/sessions/update/:sessionId', sessionController.updateSession);
router.delete('/sessions/delete/:sessionId', sessionController.deleteSession);

module.exports = router;
