const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/user/register', userController.register);
router.get('/users/get-all', userController.getAllUsers);
router.get('/users/get-by-id/:userId', userController.getUserById);
router.put('/users/update/:userId', userController.updateUser);
router.delete('/users/delete/:userId', userController.deleteUser);

module.exports = router;
