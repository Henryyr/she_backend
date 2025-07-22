const requestLogger = (req, res, next) => {
  console.log('[BookingRoutes] Incoming request:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
};

module.exports = requestLogger;
