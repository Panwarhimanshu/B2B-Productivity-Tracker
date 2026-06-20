const router = require('express').Router();
const { body } = require('express-validator');
const {
  getUsers, getUserById, createUser, updateUser, hideUser, reactivateUser,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', authorize('HOD', 'TEAM_LEAD'), getUsers);
router.get('/:id', authorize('HOD', 'TEAM_LEAD'), getUserById);

router.post(
  '/',
  authorize('HOD'),
  [
    body('name').notEmpty().trim().withMessage('Name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['RM', 'TEAM_LEAD', 'HOD']).withMessage('Invalid role'),
  ],
  validate,
  createUser
);

router.put('/:id', authorize('HOD'), updateUser);
router.patch('/:id/hide', authorize('HOD'), hideUser);
router.patch('/:id/reactivate', authorize('HOD'), reactivateUser);

module.exports = router;
