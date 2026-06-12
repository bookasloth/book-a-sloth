/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'routes/**/*.js',
    'lib/**/*.js',
    '!utils/sendEmail.js',
    '!utils/notify.js',
    '!utils/logger.js',
  ],
  coverageThreshold: { global: { lines: 32, functions: 30 } },
  setupFilesAfterEnv: [],
  clearMocks: true,
  restoreMocks: true,
};
