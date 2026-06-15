const express = require('express');
const contentController = require('../controllers/content.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');

const router = express.Router();

// Blog Routes
router.route('/blog')
  .get(contentController.getPublishedPosts)
  .post(protect, restrictTo('admin'), contentController.createPost);

router.route('/blog/:slug')
  .get(contentController.getPostBySlug);

router.route('/blog/:id') // Different param to avoid conflict with slug
  .put(protect, restrictTo('admin'), contentController.updatePost)
  .delete(protect, restrictTo('admin'), contentController.deletePost);

// FAQ Routes
router.route('/faq')
  .get(contentController.getAllFaqs)
  .post(protect, restrictTo('admin'), contentController.createFaq);

router.route('/faq/:id')
  .put(protect, restrictTo('admin'), contentController.updateFaq)
  .delete(protect, restrictTo('admin'), contentController.deleteFaq);

module.exports = router;
