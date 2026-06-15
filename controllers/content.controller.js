const contentService = require('../services/content.service');

// Blog Controllers
exports.getPublishedPosts = async (req, res, next) => {
  try {
    const posts = await contentService.getPublishedPosts();
    res.status(200).json({ status: 'success', data: { posts } });
  } catch (error) {
    next(error);
  }
};

exports.getPostBySlug = async (req, res, next) => {
  try {
    const post = await contentService.getPostBySlug(req.params.slug);
    res.status(200).json({ status: 'success', data: { post } });
  } catch (error) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const post = await contentService.createPost(req.body);
    res.status(201).json({ status: 'success', data: { post } });
  } catch (error) {
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await contentService.updatePost(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { post } });
  } catch (error) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    await contentService.deletePost(req.params.id);
    res.status(200).json({ status: 'success', message: 'Post deleted successfully' });
  } catch (error) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

// FAQ Controllers
exports.getAllFaqs = async (req, res, next) => {
  try {
    const faqs = await contentService.getAllFaqs();
    res.status(200).json({ status: 'success', data: { faqs } });
  } catch (error) {
    next(error);
  }
};

exports.createFaq = async (req, res, next) => {
  try {
    const faq = await contentService.createFaq(req.body);
    res.status(201).json({ status: 'success', data: { faq } });
  } catch (error) {
    next(error);
  }
};

exports.updateFaq = async (req, res, next) => {
  try {
    const faq = await contentService.updateFaq(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { faq } });
  } catch (error) {
    if (error.message === 'FAQ not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.deleteFaq = async (req, res, next) => {
  try {
    await contentService.deleteFaq(req.params.id);
    res.status(200).json({ status: 'success', message: 'FAQ deleted successfully' });
  } catch (error) {
    if (error.message === 'FAQ not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
