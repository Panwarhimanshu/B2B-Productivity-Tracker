const router = require('express').Router();
const { getTeams, createTeam, updateTeam } = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.get('/', authorize('HOD', 'TEAM_LEAD'), getTeams);
router.post('/', authorize('HOD'), createTeam);
router.put('/:id', authorize('HOD'), updateTeam);

module.exports = router;
