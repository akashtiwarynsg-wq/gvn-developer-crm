const router = require('express').Router();
const ctrl   = require('../controllers/leadsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get ('/',                  ctrl.getAll);
router.get ('/:id',               ctrl.getOne);
router.post('/',                  ctrl.create);
router.put ('/:id',               ctrl.update);
router.delete('/:id',             authorize('admin','sales_manager'), ctrl.remove);
router.get ('/:id/followups',     ctrl.getFollowups);
router.post('/:id/followups',     ctrl.addFollowup);

module.exports = router;
