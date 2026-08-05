const connectDB = require('../backend/src/config/database');
const app = require('../backend/src/app');

let connected = false;

module.exports = async (req, res) => {
  try {
    if (!connected) {
      await connectDB();
      connected = true;
    }
    return app(req, res);
  } catch (error) {
    console.error('API initialization error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, message: 'Server initialization failed' }));
  }
};
