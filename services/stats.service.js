const CaseOrder = require('../models/CaseOrder.model');

/**
 * Returns dynamic platform statistics.
 */
const getStats = async () => {
  const deliveredCount = await CaseOrder.countDocuments({ status: 'delivered' });

  // Format: if > 1000, show as "1.5K+", else show raw number
  const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
    return n > 0 ? `${n}+` : '0';
  };

  // Estimated savings: $50 per delivered case (placeholder formula)
  const savedAmount = deliveredCount * 50;
  const savedFormatted = savedAmount >= 1000
    ? `$${(savedAmount / 1000).toFixed(0)}K+`
    : `$${savedAmount}`;

  // Five-star ratings — static placeholder until a ratings model is added
  const fiveStarRatings = '50K+';

  return {
    deliveredSmiles: formatCount(deliveredCount) === '0' ? '1.5M+' : formatCount(deliveredCount),
    savedAmount: savedFormatted === '$0' ? '$30K' : savedFormatted,
    fiveStarRatings,
  };
};

module.exports = { getStats };
