const express = require('express');
const productController = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');

const router = express.Router();

router.route('/')
  .get(productController.getAllActive)
  .post(protect, restrictTo('admin'), productController.create);

router.route('/:id')
  .get(productController.getById)
  .put(protect, restrictTo('admin'), productController.update)
  .delete(protect, restrictTo('admin'), productController.delete);

module.exports = router;
