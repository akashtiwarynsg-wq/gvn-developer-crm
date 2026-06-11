const router = require('express').Router();
const ctrl   = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard',    ctrl.dashboard);
router.get('/monthly',      ctrl.monthlyTrend);
router.get('/lead-sources', ctrl.leadSources);
router.get('/lead-statuses',ctrl.leadStatuses);
router.get('/sales',        ctrl.salesPerformance);
router.get('/inventory',    ctrl.inventorySummary);
router.get('/outstanding',  ctrl.paymentOutstanding);
router.get('/brokers',      ctrl.brokerPerformance);

module.exports = router;
