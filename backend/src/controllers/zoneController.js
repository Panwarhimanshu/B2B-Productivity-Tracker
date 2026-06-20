const Zone = require('../models/Zone');

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
    const zone = await Zone.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, message: 'Zone deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getZones, createZone, updateZone, deleteZone };
