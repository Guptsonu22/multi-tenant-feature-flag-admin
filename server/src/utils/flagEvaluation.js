const crypto = require('crypto');

const evaluateFlag = (flag, context = {}) => {
  if (!flag) {
    return false;
  }

  if (flag.type === 'percentage') {
    const userId = context.userId || context.user?.id || context.user?.userId || '';
    const flagKey = context.flagKey || flag.key || '';

    if (!userId || !flagKey) {
      return false;
    }

    const hash = crypto.createHash('sha256').update(`${userId}:${flagKey}`).digest('hex');
    const bucket = parseInt(hash.slice(0, 8), 16) % 100;
    return bucket < Number(flag.rolloutPercentage || 0);
  }

  return Boolean(flag.enabled);
};

module.exports = {
  evaluateFlag,
};
