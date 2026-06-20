require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Zone = require('../src/models/Zone');
const Team = require('../src/models/Team');
const FormTemplate = require('../src/models/FormTemplate');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b_task_tracker');
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Zone.deleteMany({}),
    Team.deleteMany({}),
    FormTemplate.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const zones = await Zone.insertMany([
    { name: 'North', description: 'Northern region' },
    { name: 'South', description: 'Southern region' },
    { name: 'East', description: 'Eastern region' },
    { name: 'West', description: 'Western region' },
  ]);
  console.log('Zones seeded:', zones.map((z) => z.name).join(', '));

  const hod = await User.create({
    name: 'Rajesh Kumar',
    email: 'hod@company.com',
    password: 'Admin@123',
    role: 'HOD',
    employeeId: 'HOD001',
    zoneId: zones[0]._id,
    joiningDate: new Date('2020-01-15'),
  });

  const teamLead1 = await User.create({
    name: 'Priya Sharma',
    email: 'tl1@company.com',
    password: 'Admin@123',
    role: 'TEAM_LEAD',
    employeeId: 'TL001',
    zoneId: zones[0]._id,
    joiningDate: new Date('2021-03-10'),
  });

  const teamLead2 = await User.create({
    name: 'Amit Singh',
    email: 'tl2@company.com',
    password: 'Admin@123',
    role: 'TEAM_LEAD',
    employeeId: 'TL002',
    zoneId: zones[1]._id,
    joiningDate: new Date('2021-06-20'),
  });

  // Use User.create (not insertMany) so the pre('save') hook hashes each password.
  const rmData = [
    { name: 'Anita Verma', email: 'rm1@company.com', password: 'User@123', role: 'RM', employeeId: 'RM001', zoneId: zones[0]._id, teamLeadId: teamLead1._id, joiningDate: new Date('2022-01-10') },
    { name: 'Rohit Gupta', email: 'rm2@company.com', password: 'User@123', role: 'RM', employeeId: 'RM002', zoneId: zones[0]._id, teamLeadId: teamLead1._id, joiningDate: new Date('2022-03-15') },
    { name: 'Sunita Patel', email: 'rm3@company.com', password: 'User@123', role: 'RM', employeeId: 'RM003', zoneId: zones[1]._id, teamLeadId: teamLead2._id, joiningDate: new Date('2022-05-20') },
    { name: 'Vikram Rao', email: 'rm4@company.com', password: 'User@123', role: 'RM', employeeId: 'RM004', zoneId: zones[1]._id, teamLeadId: teamLead2._id, joiningDate: new Date('2022-07-01') },
  ];
  const rms = [];
  for (const data of rmData) {
    rms.push(await User.create(data));
  }
  console.log('Users seeded');

  await Team.insertMany([
    { name: 'North Team Alpha', teamLeadId: teamLead1._id, zoneId: zones[0]._id, members: [rms[0]._id, rms[1]._id] },
    { name: 'South Team Beta', teamLeadId: teamLead2._id, zoneId: zones[1]._id, members: [rms[2]._id, rms[3]._id] },
  ]);
  console.log('Teams seeded');

  await FormTemplate.create({
    name: 'Default Daily Report',
    createdBy: hod._id,
    fields: [
      { fieldKey: 'calls_made', fieldLabel: 'Calls Made', fieldType: 'number', required: true, order: 1, placeholder: 'Enter number of calls' },
      { fieldKey: 'meetings_attended', fieldLabel: 'Meetings Attended', fieldType: 'number', required: true, order: 2 },
      { fieldKey: 'proposals_sent', fieldLabel: 'Proposals Sent', fieldType: 'number', required: false, order: 3 },
      { fieldKey: 'deals_closed', fieldLabel: 'Deals Closed', fieldType: 'number', required: false, order: 4 },
      { fieldKey: 'client_visits', fieldLabel: 'Client Visits', fieldType: 'number', required: false, order: 5 },
      { fieldKey: 'lead_status', fieldLabel: 'Lead Status Update', fieldType: 'dropdown', required: false, options: ['Hot', 'Warm', 'Cold', 'Converted', 'Lost'], order: 6 },
      { fieldKey: 'daily_remarks', fieldLabel: 'Daily Remarks', fieldType: 'textarea', required: false, order: 7, placeholder: 'Any additional notes...' },
    ],
  });
  console.log('Form template seeded');

  console.log('\n=== Seed Complete ===');
  console.log('Demo credentials:');
  console.log('HOD:       hod@company.com  / Admin@123');
  console.log('Team Lead: tl1@company.com  / Admin@123');
  console.log('Team Lead: tl2@company.com  / Admin@123');
  console.log('RM:        rm1@company.com  / User@123');
  console.log('RM:        rm2@company.com  / User@123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
