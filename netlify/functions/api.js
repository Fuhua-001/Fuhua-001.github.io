const serverless = require('serverless-http');
const app = require('../../server'); // import the express app

// Wrap the Express app with base path for Netlify Functions
module.exports.handler = serverless(app, { basePath: '/.netlify/functions/api' });
