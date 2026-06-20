const router = require('express').Router();
const { body } = require('express-validator');
const { getZones, createZone, updateZone, deleteZone } = require('../controllers/zoneController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', getZones);

router.post(
  '/',
  authorize('HOD'),
  [body('name').notEmpty().trim().withMessage('Zone name required')],
  validate,
  createZone
);

router.put('/:id', authorize('HOD'), updateZone);
router.delete('/:id', authorize('HOD'), deleteZone);

module.exports = router;
