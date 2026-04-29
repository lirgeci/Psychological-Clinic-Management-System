const express = require('express');
const roomController = require('../controllers/roomController');

const router = express.Router();

router.post('/rooms/create', roomController.createRoom);
router.get('/rooms/get-all', roomController.getAllRooms);
router.get('/rooms/get-by-id/:roomId', roomController.getRoomById);
router.put('/rooms/update/:roomId', roomController.updateRoom);
router.delete('/rooms/delete/:roomId', roomController.deleteRoom);

module.exports = router;
