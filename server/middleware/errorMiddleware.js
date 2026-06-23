const { captureException } = require('../utils/sentry');

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  // Report server-side failures (5xx) to Sentry; 4xx are client errors, not bugs.
  // No-op unless Sentry is configured.
  if (statusCode >= 500) {
    captureException(err, { path: req.originalUrl, method: req.method });
  }
  // Only surface specific messages for client errors (4xx) or errors explicitly
  // marked safe to expose. 5xx and unmarked errors get a generic message so we
  // don't leak DB driver / internal details to the client.
  const expose = err.expose === true || (statusCode >= 400 && statusCode < 500);
  res.status(statusCode).json({
    message: expose ? err.message : 'Something went wrong. Please try again.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
