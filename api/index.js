const connectDB = require('../backend/src/config/database');
const app = require('../backend/src/app');

let connected = false;

module.exports = async (req, res) => {
  if (!connected) {
    await connectDB();
    connected = true;
  }
  return app(req, res);
};
