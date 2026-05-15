const express = require('express');
const sessionNoteController = require('../controllers/sessionNoteController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/session-notes/create', authenticate(['admin','therapist']), sessionNoteController.createSessionNote);
router.get('/session-notes/get-all', authenticate(['admin','therapist']), sessionNoteController.getAllSessionNotes);
router.get('/session-notes/get-by-id/:sessionNoteId', authenticate(['admin','therapist']), sessionNoteController.getSessionNoteById);
router.get('/session-notes/get-by-session/:sessionId', authenticate(['admin','therapist']), sessionNoteController.getSessionNoteBySessionId);
router.put('/session-notes/update/:sessionNoteId', authenticate(['admin','therapist']), sessionNoteController.updateSessionNote);
router.delete('/session-notes/delete/:sessionNoteId', authenticate(['admin','therapist']), sessionNoteController.deleteSessionNote);

module.exports = router;
