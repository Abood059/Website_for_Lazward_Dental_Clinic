const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: 'تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة لاحقاً بعد 15 دقيقة.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };
