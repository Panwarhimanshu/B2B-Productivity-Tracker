const TeamMember = require('../models/TeamMember');
const cloudinary = require('../config/cloudinary');

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB base64 input limit

const getMembers = async (req, res, next) => {
  try {
    const filter = req.user.role === 'HOD' ? {} : { visible: true };
    const members = await TeamMember.find(filter).sort({ department: 1, name: 1 });
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

const uploadPhotoIfProvided = async (photo, publicId) => {
  if (!photo) return { photo: null, photoPublicId: null };
  if (typeof photo !== 'string' || !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(photo)) {
    const err = new Error('A valid image is required');
    err.statusCode = 400;
    throw err;
  }
  if (Buffer.byteLength(photo, 'utf8') > MAX_PHOTO_BYTES) {
    const err = new Error('Image is too large (max 5MB)');
    err.statusCode = 400;
    throw err;
  }
  const result = await cloudinary.uploader.upload(photo, {
    folder: 'b2b-tracker/directory',
    public_id: publicId,
    overwrite: true,
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face', quality: 'auto' }],
  });
  return { photo: result.secure_url, photoPublicId: result.public_id };
};

const createMember = async (req, res, next) => {
  try {
    const { name, role, department, phone, email, desc, visible, photo } = req.body;

    let photoFields = { photo: null, photoPublicId: null };
    const member = await TeamMember.create({ name, role, department, phone, email, desc, visible });

    if (photo && photo.startsWith('data:image')) {
      photoFields = await uploadPhotoIfProvided(photo, `member_${member._id}`);
      member.photo = photoFields.photo;
      member.photoPublicId = photoFields.photoPublicId;
      await member.save();
    }

    res.status(201).json({ success: true, message: 'Member created successfully', data: member });
  } catch (error) {
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const { name, role, department, phone, email, desc, visible, photo } = req.body;
    const member = await TeamMember.findById(req.params.id).select('+photoPublicId');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    member.set({ name, role, department, phone, email, desc, visible });

    if (photo && photo.startsWith('data:image')) {
      if (member.photoPublicId) {
        await cloudinary.uploader.destroy(member.photoPublicId).catch(() => {});
      }
      const photoFields = await uploadPhotoIfProvided(photo, `member_${member._id}`);
      member.photo = photoFields.photo;
      member.photoPublicId = photoFields.photoPublicId;
    } else if (photo === null) {
      if (member.photoPublicId) {
        await cloudinary.uploader.destroy(member.photoPublicId).catch(() => {});
      }
      member.photo = null;
      member.photoPublicId = null;
    }

    await member.save();
    res.json({ success: true, message: 'Member updated successfully', data: member });
  } catch (error) {
    next(error);
  }
};

const toggleVisibility = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    member.visible = !member.visible;
    await member.save();
    res.json({ success: true, message: member.visible ? 'Member is now visible' : 'Member hidden', data: member });
  } catch (error) {
    next(error);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id).select('+photoPublicId');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    if (member.photoPublicId) {
      await cloudinary.uploader.destroy(member.photoPublicId).catch(() => {});
    }
    await member.deleteOne();
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMembers, createMember, updateMember, toggleVisibility, deleteMember };
