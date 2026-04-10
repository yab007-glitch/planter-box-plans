const rateLimitMap = new Map();

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const max = 30; // 30 requests per minute

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }

  if (record.count > max) {
    res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
    res.status(429).json({ error: 'Too many requests, please try again later' });
    return true;
  }

  return false;
};