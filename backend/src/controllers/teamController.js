const Team = require('../models/Team');
const User = require('../models/User');

const getTeams = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'TEAM_LEAD') filter.teamLeadId = req.user._id;

    const teams = await Team.find(filter)
      .populate('teamLeadId', 'name email')
      .populate('zoneId', 'name')
      .populate('members', 'name email employeeId');

    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const { name, teamLeadId, zoneId, members } = req.body;
    const team = await Team.create({ name, teamLeadId, zoneId, members });

    if (members && members.length > 0) {
      await User.updateMany({ _id: { $in: members } }, { teamLeadId });
    }

    const populated = await team.populate(['teamLeadId', 'zoneId', 'members']);
    res.status(201).json({ success: true, message: 'Team created successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const { name, teamLeadId, zoneId, members } = req.body;

    if (members) {
      const removedMembers = team.members.filter((m) => !members.includes(m.toString()));
      const addedMembers = members.filter((m) => !team.members.map((tm) => tm.toString()).includes(m));

      if (removedMembers.length > 0) {
        await User.updateMany({ _id: { $in: removedMembers } }, { $unset: { teamLeadId: 1 } });
      }
      if (addedMembers.length > 0 && teamLeadId) {
        await User.updateMany({ _id: { $in: addedMembers } }, { teamLeadId: teamLeadId || team.teamLeadId });
      }
    }

    Object.assign(team, { name, teamLeadId, zoneId, members });
    await team.save();

    res.json({ success: true, message: 'Team updated successfully', data: team });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeams, createTeam, updateTeam };
