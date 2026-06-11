const router = require('express').Router();
const ctrl   = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get ('/',     authorize('admin','sales_manager'), ctrl.getAll);
router.get ('/:id',  authorize('admin','sales_manager'), ctrl.getOne);
router.post('/',     authorize('admin'),                  ctrl.create);
router.put ('/:id',  authorize('admin'),                  ctrl.update);

module.exports = router;
