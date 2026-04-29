const express = require('express');
const sessionController = require('../controllers/sessionController');

const router = express.Router();

router.get('/sessions/get-all', sessionController.getAllSessions);
router.get('/sessions/get-by-id/:sessionId', sessionController.getSessionById);

module.exports = router;
