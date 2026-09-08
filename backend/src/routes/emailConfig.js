const router = require('express').Router();
const { getConfig, updateConfig, getLogs, sendTest } = require('../controllers/emailConfigController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authenticate, authorize('HOD'));

router.get('/', getConfig);
router.put('/', updateConfig);
router.get('/logs', getLogs);
router.post('/test', sendTest);

module.exports = router;
