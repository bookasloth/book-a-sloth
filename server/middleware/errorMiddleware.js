const { captureException } = require('../utils/sentry');

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  // Report server-side failures (5xx) to Sentry; 4xx are client errors, not bugs.
  // No-op unless Sentry is configured.
  if (statusCode >= 500) {
    captureException(err, { path: req.originalUrl, method: req.method });
  }
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
