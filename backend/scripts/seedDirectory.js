require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TeamMember = require('../src/models/TeamMember');
const DIRECTORY_SEED_DATA = require('./directorySeedData');

const seedDirectory = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b_task_tracker');
  console.log('Connected to MongoDB');

  await TeamMember.deleteMany({});
  await TeamMember.insertMany(DIRECTORY_SEED_DATA);
  console.log('Team directory seeded:', DIRECTORY_SEED_DATA.length, 'members');

  await mongoose.disconnect();
  process.exit(0);
};

seedDirectory().catch((err) => {
  console.error('Directory seed failed:', err);
  process.exit(1);
});
