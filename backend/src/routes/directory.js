const router = require('express').Router();
const { body } = require('express-validator');
const {
  getMembers,
  createMember,
  updateMember,
  toggleVisibility,
  deleteMember,
} = require('../controllers/directoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', getMembers);

router.post(
  '/',
  authorize('HOD'),
  [
    body('name').notEmpty().trim().withMessage('Name required'),
    body('role').notEmpty().trim().withMessage('Role required'),
    body('department').notEmpty().trim().withMessage('Department required'),
  ],
  validate,
  createMember
);

router.put('/:id', authorize('HOD'), updateMember);
router.patch('/:id/toggle', authorize('HOD'), toggleVisibility);
router.delete('/:id', authorize('HOD'), deleteMember);

module.exports = router;
