// Vercel Serverless Function Wrapper
// This allows the Express server to run as a serverless function on Vercel

const app = require('../server/index.js');

// Export as serverless function
module.exports = app;

