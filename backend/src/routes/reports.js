const router = require('express').Router();
const { body } = require('express-validator');
const {
  submitReport, getMyReports, getTeamReports, getAllReports,
  updateReport, getAnalytics, getTrackerSummary, exportReports, getFormTemplate,
} = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/template', getFormTemplate);
router.get('/analytics', getAnalytics);
router.get('/summary', getTrackerSummary);
router.get('/my', getMyReports);
router.get('/team', authorize('TEAM_LEAD', 'HOD'), getTeamReports);
router.get('/all', authorize('HOD'), getAllReports);
router.get('/export', authorize('TEAM_LEAD', 'HOD'), exportReports);

router.post(
  '/',
  authorize('RM'),
  [
    body('date').isISO8601().withMessage('Valid date required'),
    body('tasks').notEmpty().withMessage('Tasks data required'),
  ],
  validate,
  submitReport
);

router.put('/:id', authorize('RM', 'TEAM_LEAD', 'HOD'), updateReport);

module.exports = router;
