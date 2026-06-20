const router = require('express').Router();
const { body } = require('express-validator');
const { login, refresh, logout, getMe, updateAvatar, removeAvatar } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/avatar', authenticate, updateAvatar);
router.delete('/avatar', authenticate, removeAvatar);

module.exports = router;
