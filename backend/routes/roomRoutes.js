const express = require('express');
const roomController = require('../controllers/roomController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/rooms/create', authenticate(['admin']), roomController.createRoom);
router.get('/rooms/get-all', authenticate(['admin','therapist']), roomController.getAllRooms);
router.get('/rooms/get-by-id/:roomId', authenticate(['admin','therapist']), roomController.getRoomById);
router.put('/rooms/update/:roomId', authenticate(['admin']), roomController.updateRoom);
router.delete('/rooms/delete/:roomId', authenticate(['admin']), roomController.deleteRoom);

module.exports = router;
