const { SessionNote, Session, sequelize } = require('../models');

const REQUIRED_FIELDS = ['sessionId', 'notes', 'createdDate'];

exports.createSessionNote = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  const { sessionId, notes, progress, homework, nextPlan, createdDate } = req.body;

  try {
    const sessionNote = await SessionNote.create({
      SessionId: sessionId,
      Notes: notes,
      Progress: progress || null,
      Homework: homework || null,
      NextPlan: nextPlan || null,
      CreatedDate: createdDate,
    });

    return res.status(201).json({
      message: 'Session note created successfully.',
      sessionNote,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create session note.',
    });
  }
};

exports.getAllSessionNotes = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await SessionNote.count();
    const sessionNotes = await SessionNote.findAll({
      offset,
      limit,
      include: [
        {
          model: Session,
          as: 'Session',
          attributes: ['Id', 'PatientId', 'TherapistId', 'SessionDate', 'StartTime', 'EndTime', 'Status'],
        },
      ],
      order: [['CreatedDate', 'DESC']],
    });

    if (!sessionNotes || sessionNotes.length === 0) {
      return res.status(404).json({ message: 'No session notes found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      sessionNotes,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch session notes.',
    });
  }
};

exports.getSessionNoteById = async (req, res) => {
  try {
    const sessionNoteId = Number(req.params.sessionNoteId);
    if (!Number.isInteger(sessionNoteId) || sessionNoteId < 1) {
      return res.status(400).json({ message: 'Invalid sessionNoteId format.' });
    }

    const sessionNote = await SessionNote.findByPk(sessionNoteId, {
      include: [
        {
          model: Session,
          as: 'Session',
          attributes: ['Id', 'PatientId', 'TherapistId', 'SessionDate', 'StartTime', 'EndTime', 'Status'],
        },
      ],
    });

    if (!sessionNote) {
      return res.status(404).json({ message: 'Session note not found.' });
    }

    return res.status(200).json(sessionNote);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch session note.',
    });
  }
};

exports.getSessionNoteBySessionId = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return res.status(400).json({ message: 'Invalid sessionId format.' });
    }

    const sessionNote = await SessionNote.findOne({
      where: { SessionId: sessionId },
      include: [
        {
          model: Session,
          as: 'Session',
          attributes: ['Id', 'PatientId', 'TherapistId', 'SessionDate', 'StartTime', 'EndTime', 'Status'],
        },
      ],
    });

    if (!sessionNote) {
      return res.status(404).json({ message: 'Session note not found for this session.' });
    }

    return res.status(200).json(sessionNote);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch session note.',
    });
  }
};

exports.updateSessionNote = async (req, res) => {
  let transaction;

  try {
    const sessionNoteId = Number(req.params.sessionNoteId);
    if (!Number.isInteger(sessionNoteId) || sessionNoteId < 1) {
      return res.status(400).json({ message: 'Invalid sessionNoteId format.' });
    }

    const { notes, progress, homework, nextPlan } = req.body;

    if (
      notes === undefined &&
      progress === undefined &&
      homework === undefined &&
      nextPlan === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();
    const existingSessionNote = await SessionNote.findByPk(sessionNoteId, { transaction });

    if (!existingSessionNote) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Session note not found.' });
    }

    const updatePayload = {};
    if (notes !== undefined) updatePayload.Notes = notes;
    if (progress !== undefined) updatePayload.Progress = progress;
    if (homework !== undefined) updatePayload.Homework = homework;
    if (nextPlan !== undefined) updatePayload.NextPlan = nextPlan;

    await SessionNote.update(updatePayload, {
      where: { Id: sessionNoteId },
      transaction,
    });

    const updatedSessionNote = await SessionNote.findByPk(sessionNoteId, {
      include: [
        {
          model: Session,
          as: 'Session',
          attributes: ['Id', 'PatientId', 'TherapistId', 'SessionDate', 'StartTime', 'EndTime', 'Status'],
        },
      ],
      transaction,
    });
    await transaction.commit();

    return res.status(200).json({
      message: 'Session note updated successfully.',
      sessionNote: updatedSessionNote,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update session note.',
    });
  }
};

exports.deleteSessionNote = async (req, res) => {
  let transaction;

  try {
    const sessionNoteId = Number(req.params.sessionNoteId);
    if (!Number.isInteger(sessionNoteId) || sessionNoteId < 1) {
      return res.status(400).json({ message: 'Invalid sessionNoteId format.' });
    }

    transaction = await sequelize.transaction();
    const existingSessionNote = await SessionNote.findByPk(sessionNoteId, { transaction });

    if (!existingSessionNote) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Session note not found.' });
    }

    await SessionNote.destroy({ where: { Id: sessionNoteId }, transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Session note deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete session note due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete session note.',
    });
  }
};
