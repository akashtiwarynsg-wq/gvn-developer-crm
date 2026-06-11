const router = require('express').Router();
const ctrl   = require('../controllers/brokersController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get ('/',    ctrl.getAll);
router.get ('/:id', ctrl.getOne);
router.post('/',    authorize('admin','sales_manager'), ctrl.create);
router.put ('/:id', authorize('admin','sales_manager'), ctrl.update);
router.delete('/:id',authorize('admin'),                ctrl.remove);

module.exports = router;
