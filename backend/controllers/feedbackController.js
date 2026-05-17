const { Feedback, Session, Patient, Therapist, sequelize } = require('../models');

const REQUIRED_FIELDS = ['sessionId', 'rating'];

const getCurrentPatient = async (userId) => {
  return Patient.findOne({ where: { UserId: userId } });
};

const getCurrentTherapist = async (userId) => {
  return Therapist.findOne({ where: { UserId: userId } });
};

exports.createFeedback = async (req, res) => {
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

    const patient = await getCurrentPatient(userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found.' });
    }

    const sessionId = Number(req.body.sessionId);
    const rating = Number(req.body.rating);
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return res.status(400).json({ message: 'Invalid session id format.' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (Number(session.PatientId) !== Number(patient.Id)) {
      return res.status(403).json({ message: 'You can only leave feedback for your own sessions.' });
    }

    if (String(session.Status || '').toLowerCase() !== 'completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for completed sessions.' });
    }

    const existingFeedback = await Feedback.findOne({
      where: {
        SessionId: sessionId,
        PatientId: patient.Id,
      },
    });

    if (existingFeedback) {
      return res.status(409).json({ message: 'Feedback already submitted for this session.' });
    }

    const feedback = await Feedback.create({
      SessionId: sessionId,
      PatientId: patient.Id,
      TherapistId: session.TherapistId,
      Rating: rating,
      Comment: req.body.comment || null,
      CreatedAt: new Date(),
    });

    return res.status(201).json({
      message: 'Feedback created successfully.',
      feedback,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create feedback.',
    });
  }
};

exports.getAllFeedback = async (_req, res) => {
  try {
    const feedback = await Feedback.findAll({
      include: [
        {
          model: Session,
          attributes: ['Id', 'SessionDate', 'Status', 'TherapistId', 'PatientId'],
        },
        {
          model: Patient,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      order: [['CreatedAt', 'DESC']],
    });

    return res.status(200).json({ feedback });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch feedback.',
    });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Invalid user identity.' });
    }

    const therapist = await getCurrentTherapist(userId);
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found.' });
    }

    const feedback = await Feedback.findAll({
      where: { TherapistId: therapist.Id },
      include: [
        {
          model: Session,
          attributes: ['Id', 'SessionDate', 'Status', 'TherapistId', 'PatientId'],
        },
        {
          model: Patient,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      order: [['CreatedAt', 'DESC']],
    });

    return res.status(200).json({ feedback });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch your feedback.',
    });
  }
};

exports.getFeedbackById = async (req, res) => {
  try {
    const feedbackId = Number(req.params.id);
    if (!Number.isInteger(feedbackId) || feedbackId < 1) {
      return res.status(400).json({ message: 'Invalid feedback id format.' });
    }

    const feedback = await Feedback.findByPk(feedbackId, {
      include: [
        {
          model: Session,
          attributes: ['Id', 'SessionDate', 'Status', 'TherapistId', 'PatientId'],
        },
        {
          model: Patient,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
    });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found.' });
    }

    const roleId = Number(req.user?.roleId || 0);
    if (roleId === 2) {
      const therapist = await getCurrentTherapist(Number(req.user?.userId));
      if (!therapist || Number(therapist.Id) !== Number(feedback.TherapistId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    if (roleId === 3) {
      const patient = await getCurrentPatient(Number(req.user?.userId));
      if (!patient || Number(patient.Id) !== Number(feedback.PatientId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    return res.status(200).json(feedback);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch feedback.',
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  let transaction;

  try {
    const feedbackId = Number(req.params.id);
    if (!Number.isInteger(feedbackId) || feedbackId < 1) {
      return res.status(400).json({ message: 'Invalid feedback id format.' });
    }

    transaction = await sequelize.transaction();

    const existingFeedback = await Feedback.findByPk(feedbackId, { transaction });
    if (!existingFeedback) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Feedback not found.' });
    }

    await Feedback.destroy({ where: { Id: feedbackId }, transaction });
    await transaction.commit();

    return res.status(200).json({ message: 'Feedback deleted successfully.' });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete feedback.',
    });
  }
};