const express = require('express');
const announcementController = require('../controllers/announcementController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/announcements/create', authenticate(['admin']), announcementController.createAnnouncement);
router.get('/announcements/get-all', authenticate(['admin', 'therapist', 'patient']), announcementController.getAllAnnouncements);
router.get('/announcements/get-by-id/:id', authenticate(['admin', 'therapist', 'patient']), announcementController.getAnnouncementById);
router.put('/announcements/update/:id', authenticate(['admin']), announcementController.updateAnnouncement);
router.delete('/announcements/delete/:id', authenticate(['admin']), announcementController.deleteAnnouncement);

module.exports = router;