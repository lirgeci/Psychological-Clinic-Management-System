const { Session, Patient, Therapist } = require('../models');

exports.getAllSessions = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await Session.count();
    const sessions = await Session.findAll({
      include: [
        {
          model: Patient,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      offset,
      limit,
      order: [['SessionDate', 'DESC'], ['StartTime', 'ASC']],
    });

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ message: 'No sessions found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch sessions.',
    });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return res.status(400).json({ message: 'Invalid sessionId format.' });
    }

    const session = await Session.findByPk(sessionId, {
      include: [
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

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch session.',
    });
  }
};
