const { Announcement, User, sequelize } = require('../models');

const REQUIRED_FIELDS = ['title', 'message'];

exports.createAnnouncement = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  try {
    const userId = Number(req.user?.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Invalid user identity.' });
    }

    const announcement = await Announcement.create({
      Title: req.body.title,
      Message: req.body.message,
      UserId: userId,
      CreatedAt: new Date(),
      ExpiresAt: req.body.expiresAt || null,
    });

    return res.status(201).json({
      message: 'Announcement created successfully.',
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create announcement.',
    });
  }
};

exports.getAllAnnouncements = async (_req, res) => {
  try {
    const announcements = await Announcement.findAll({
      include: [
        {
          model: User,
          attributes: ['Id', 'Email'],
        },
      ],
      order: [['CreatedAt', 'DESC']],
    });

    return res.status(200).json({ announcements });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch announcements.',
    });
  }
};

exports.getAnnouncementById = async (req, res) => {
  try {
    const announcementId = Number(req.params.id);
    if (!Number.isInteger(announcementId) || announcementId < 1) {
      return res.status(400).json({ message: 'Invalid announcement id format.' });
    }

    const announcement = await Announcement.findByPk(announcementId, {
      include: [
        {
          model: User,
          attributes: ['Id', 'Email'],
        },
      ],
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    return res.status(200).json(announcement);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch announcement.',
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  let transaction;

  try {
    const announcementId = Number(req.params.id);
    if (!Number.isInteger(announcementId) || announcementId < 1) {
      return res.status(400).json({ message: 'Invalid announcement id format.' });
    }

    const { title, message, expiresAt } = req.body;
    if (title === undefined && message === undefined && expiresAt === undefined) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();

    const existingAnnouncement = await Announcement.findByPk(announcementId, { transaction });
    if (!existingAnnouncement) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.Title = title;
    if (message !== undefined) updatePayload.Message = message;
    if (expiresAt !== undefined) updatePayload.ExpiresAt = expiresAt || null;

    await Announcement.update(updatePayload, {
      where: { Id: announcementId },
      transaction,
    });

    const updatedAnnouncement = await Announcement.findByPk(announcementId, {
      include: [
        {
          model: User,
          attributes: ['Id', 'Email'],
        },
      ],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: 'Announcement updated successfully.',
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update announcement.',
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  let transaction;

  try {
    const announcementId = Number(req.params.id);
    if (!Number.isInteger(announcementId) || announcementId < 1) {
      return res.status(400).json({ message: 'Invalid announcement id format.' });
    }

    transaction = await sequelize.transaction();

    const existingAnnouncement = await Announcement.findByPk(announcementId, { transaction });
    if (!existingAnnouncement) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    await Announcement.destroy({ where: { Id: announcementId }, transaction });
    await transaction.commit();

    return res.status(200).json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete announcement.',
    });
  }
};