const Zone = require('../models/Zone');
const Team = require('../models/Team');
const User = require('../models/User');

const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: zones });
  } catch (error) {
    next(error);
  }
};

const createZone = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const zone = await Zone.create({ name, description });
    res.status(201).json({ success: true, message: 'Zone created successfully', data: zone });
  } catch (error) {
    next(error);
  }
};

const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, message: 'Zone updated successfully', data: zone });
  } catch (error) {
    next(error);
  }
};

const deleteZone = async (req, res, next) => {
  try {
    // Permanently remove the zone from the database
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

    // Clean up referencing records: detach related teams and users from this zone
    await Team.updateMany({ zoneId: zone._id }, { $set: { zoneId: null } });
    await User.updateMany({ zoneId: zone._id }, { $set: { zoneId: null } });

    res.json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getZones, createZone, updateZone, deleteZone };
