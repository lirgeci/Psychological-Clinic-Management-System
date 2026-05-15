const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/auth/login', userController.login);
router.post('/auth/logout', userController.logout);

router.post('/user/register', userController.register);
router.get('/users/get-all', authenticate(['admin']), userController.getAllUsers);
router.get('/users/get-by-id/:userId', authenticate(['admin','therapist','patient']), userController.getUserById);
router.put('/users/update/:userId', authenticate(['admin']), userController.updateUser);
router.delete('/users/delete/:userId', authenticate(['admin']), userController.deleteUser);

module.exports = router;
