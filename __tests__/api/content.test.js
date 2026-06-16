const request = require('supertest');
const app = require('../../app');
const Faq = require('../../models/Faq.model');
const BlogPost = require('../../models/BlogPost.model');

describe('Content API', () => {
  beforeEach(async () => {
    // Create test FAQ
    await Faq.create({
      question: 'What is a crown?',
      answer: 'A crown is a tooth covering.',
    });

    // Create test blog post
    await BlogPost.create({
      title: 'Dental Health',
      slug: 'dental-health',
      contentHtml: '<p>Tips for dental health.</p>',
      isPublished: true,
    });
  });

  describe('GET /api/content/faq', () => {
    it('should retrieve all FAQs', async () => {
      const response = await request(app).get('/api/content/faq');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.faqs)).toBe(true);
      expect(response.body.data.faqs.length).toBeGreaterThan(0);
      expect(response.body.data.faqs[0].question).toBeDefined();
    });
  });

  describe('GET /api/content/blog', () => {
    it('should retrieve all published blog posts', async () => {
      const response = await request(app).get('/api/content/blog');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
      expect(response.body.data.posts.length).toBeGreaterThan(0);
      expect(response.body.data.posts[0].title).toBeDefined();
    });
  });
});
