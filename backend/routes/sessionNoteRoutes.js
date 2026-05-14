const express = require('express');
const sessionNoteController = require('../controllers/sessionNoteController');

const router = express.Router();

router.post('/session-notes/create', sessionNoteController.createSessionNote);
router.get('/session-notes/get-all', sessionNoteController.getAllSessionNotes);
router.get('/session-notes/get-by-id/:sessionNoteId', sessionNoteController.getSessionNoteById);
router.get('/session-notes/get-by-session/:sessionId', sessionNoteController.getSessionNoteBySessionId);
router.put('/session-notes/update/:sessionNoteId', sessionNoteController.updateSessionNote);
router.delete('/session-notes/delete/:sessionNoteId', sessionNoteController.deleteSessionNote);

module.exports = router;
