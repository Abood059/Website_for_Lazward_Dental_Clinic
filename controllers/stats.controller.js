const statsService = require('../services/stats.service');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await statsService.getStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
};
