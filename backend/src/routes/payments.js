const router = require('express').Router();
const ctrl   = require('../controllers/paymentsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get ('/summary', ctrl.getSummary);
router.get ('/',        ctrl.getAll);
router.get ('/:id',     ctrl.getOne);
router.post('/',        authorize('admin','accounts'), ctrl.create);
router.put ('/:id',     authorize('admin','accounts'), ctrl.update);

module.exports = router;
