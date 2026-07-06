const router = require('express').Router();
const { upsertTarget, getTargetsTable, getTargetWithActuals, getTeamTargets } = require('../controllers/targetController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.get('/table',        authorize('HOD'),       getTargetsTable);
router.get('/team',         authorize('TEAM_LEAD'), getTeamTargets);
router.get('/user/:userId', getTargetWithActuals);
router.post('/',            authorize('HOD'),       upsertTarget);

module.exports = router;
