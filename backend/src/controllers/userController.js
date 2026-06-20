const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const getUsers = async (req, res, next) => {
  try {
    const { role, zoneId, teamLeadId, isActive = 'true', page = 1, limit = 20, search } = req.query;

    const filter = { isActive: isActive === 'true' };

    if (req.user.role === 'TEAM_LEAD') {
      filter.teamLeadId = req.user._id;
    }

    if (role) filter.role = role;
    if (zoneId) filter.zoneId = zoneId;
    if (teamLeadId && req.user.role === 'HOD') filter.teamLeadId = teamLeadId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('zoneId', 'name')
        .populate('teamLeadId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('zoneId', 'name')
      .populate('teamLeadId', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, employeeId, zoneId, teamLeadId, joiningDate } = req.body;

    const user = new User({ name, email, password, role, employeeId, zoneId, teamLeadId, joiningDate });
    await user.save();

    await AuditLog.create({
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      performedBy: req.user._id,
      after: user.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, employeeId, zoneId, teamLeadId, joiningDate } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const before = user.toJSON();
    Object.assign(user, { name, email, role, employeeId, zoneId, teamLeadId, joiningDate });

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    await AuditLog.create({
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id,
      performedBy: req.user._id,
      before,
      after: user.toJSON(),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

const hideUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }

    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({
      action: 'DEACTIVATE_USER',
      entity: 'User',
      entityId: user._id,
      performedBy: req.user._id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

const reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'User reactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, hideUser, reactivateUser };
