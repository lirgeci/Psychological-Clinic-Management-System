const express = require('express');
const absenceRequestController = require('../controllers/absenceRequestController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/absence-requests/create', authenticate(['therapist']), absenceRequestController.createAbsenceRequest);
router.get('/absence-requests/get-all', authenticate(['admin']), absenceRequestController.getAllAbsenceRequests);
router.get('/absence-requests/my-requests', authenticate(['therapist']), absenceRequestController.getMyAbsenceRequests);
router.get('/absence-requests/get-by-id/:id', authenticate(['admin', 'therapist']), absenceRequestController.getAbsenceRequestById);
router.put('/absence-requests/update/:id', authenticate(['admin']), absenceRequestController.updateAbsenceRequest);
router.delete('/absence-requests/delete/:id', authenticate(['admin']), absenceRequestController.deleteAbsenceRequest);

module.exports = router;