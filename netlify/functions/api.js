const serverless = require('serverless-http');
const app = require('../../server'); // import the express app

// Wrap the Express app
module.exports.handler = serverless(app);
