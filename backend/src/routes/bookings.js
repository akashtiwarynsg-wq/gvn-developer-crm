const router = require('express').Router();
const ctrl   = require('../controllers/bookingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get ('/',    ctrl.getAll);
router.get ('/:id', ctrl.getOne);
router.post('/',    authorize('admin','sales_manager','sales_executive'), ctrl.create);
router.put ('/:id', authorize('admin','sales_manager'), ctrl.update);

module.exports = router;
