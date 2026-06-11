const router = require('express').Router();
const ctrl   = require('../controllers/customersController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get ('/',    ctrl.getAll);
router.get ('/:id', ctrl.getOne);
router.post('/',    ctrl.create);
router.put ('/:id', ctrl.update);

module.exports = router;
