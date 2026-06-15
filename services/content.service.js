const BlogPost = require('../models/BlogPost.model');
const Faq = require('../models/Faq.model');

// Blog Services
const getPublishedPosts = async () => {
  return await BlogPost.find({ isPublished: true }).sort({ publishedAt: -1 });
};

const getPostBySlug = async (slug) => {
  const post = await BlogPost.findOne({ slug });
  if (!post) throw new Error('Post not found');
  return post;
};

const createPost = async (postData) => {
  if (postData.isPublished && !postData.publishedAt) {
    postData.publishedAt = Date.now();
  }
  return await BlogPost.create(postData);
};

const updatePost = async (id, postData) => {
  if (postData.isPublished && !postData.publishedAt) {
    postData.publishedAt = Date.now();
  }
  const post = await BlogPost.findByIdAndUpdate(id, postData, { new: true });
  if (!post) throw new Error('Post not found');
  return post;
};

const deletePost = async (id) => {
  const post = await BlogPost.findByIdAndDelete(id);
  if (!post) throw new Error('Post not found');
  return true;
};

// FAQ Services
const getAllFaqs = async () => {
  return await Faq.find().sort({ order: 1 });
};

const createFaq = async (faqData) => {
  return await Faq.create(faqData);
};

const updateFaq = async (id, faqData) => {
  const faq = await Faq.findByIdAndUpdate(id, faqData, { new: true });
  if (!faq) throw new Error('FAQ not found');
  return faq;
};

const deleteFaq = async (id) => {
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) throw new Error('FAQ not found');
  return true;
};

module.exports = {
  getPublishedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq
};
