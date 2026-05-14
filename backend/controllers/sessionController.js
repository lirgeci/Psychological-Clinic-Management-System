const { Op } = require('sequelize');
const { Session, Patient, Therapist, Diagnosis, TreatmentPlan, Invoice, sequelize } = require('../models');

const REQUIRED_FIELDS = ['patientId', 'therapistId', 'date', 'startTime', 'type', 'status'];
const SESSION_BASE_RATES = {
  Individual: 120,
  Couple: 140,
  Family: 160,
};

const calculateInvoiceAmount = (sessionType) => {
  return SESSION_BASE_RATES[String(sessionType)] || SESSION_BASE_RATES.Individual;
};

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

exports.createSession = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  const {
    patientId,
    therapistId,
    date,
    startTime,
    endTime,
    type,
    status,
    privateNotes,
    patientNotes,
  } = req.body;

  try {
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const therapist = await Therapist.findByPk(therapistId);
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found.' });
    }

    const session = await Session.create({
      PatientId: patientId,
      TherapistId: therapistId,
      SessionDate: date,
      StartTime: startTime,
      EndTime: endTime || null,
      SessionType: type,
      Status: status,
      PrivateNotes: privateNotes || null,
      PatientNotes: patientNotes || null,
    });

    return res.status(201).json({
      message: 'Session created successfully.',
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create session.',
    });
  }
};

exports.updateSession = async (req, res) => {
  let transaction;

  try {
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return res.status(400).json({ message: 'Invalid sessionId format.' });
    }

    const {
      date,
      startTime,
      endTime,
      type,
      status,
      privateNotes,
      patientNotes,
    } = req.body;

    if (
      date === undefined &&
      startTime === undefined &&
      endTime === undefined &&
      type === undefined &&
      status === undefined &&
      privateNotes === undefined &&
      patientNotes === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();

    const existingSession = await Session.findByPk(sessionId, { transaction });
    if (!existingSession) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Session not found.' });
    }

    const updatePayload = {};

    if (date !== undefined) updatePayload.SessionDate = date;
    if (startTime !== undefined) updatePayload.StartTime = startTime;
    if (endTime !== undefined) updatePayload.EndTime = endTime;
    if (type !== undefined) updatePayload.SessionType = type;
    if (status !== undefined) updatePayload.Status = status;
    if (privateNotes !== undefined) updatePayload.PrivateNotes = privateNotes;
    if (patientNotes !== undefined) updatePayload.PatientNotes = patientNotes;

    await Session.update(updatePayload, { where: { Id: sessionId }, transaction });

    const updatedSession = await Session.findByPk(sessionId, {
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
      transaction,
    });

    let createdInvoice = null;
    if (String(updatedSession.Status || existingSession.Status || '') === 'Completed') {
      const existingInvoice = await Invoice.findOne({
        where: { SessionId: sessionId },
        transaction,
      });

      if (!existingInvoice) {
        const amount = calculateInvoiceAmount(
          updatedSession.SessionType
        );

        createdInvoice = await Invoice.create(
          {
            Amount: amount,
            Discount: 0,
            FinalAmount: amount,
            InvoiceDate: new Date(),
            PaymentStatus: 'Pending',
            PatientId: updatedSession.PatientId,
            SessionId: updatedSession.Id,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    return res.status(200).json({
      message: 'Session updated successfully.',
      session: updatedSession,
      invoice: createdInvoice,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update session.',
    });
  }
};

exports.deleteSession = async (req, res) => {
  let transaction;

  try {
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return res.status(400).json({ message: 'Invalid sessionId format.' });
    }

    transaction = await sequelize.transaction();

    const session = await Session.findByPk(sessionId, { transaction });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Session not found.' });
    }

    const patientId = session.PatientId;
    const therapistId = session.TherapistId;
    const sessionDate = session.SessionDate;

    // Find diagnoses for this patient/therapist and delete related treatment plans
    const diagnoses = await Diagnosis.findAll({
      where: { PatientId: patientId, TherapistId: therapistId },
      transaction,
    });

    const diagnosisIds = diagnoses.map((d) => d.Id);

    if (diagnosisIds.length > 0) {
      await TreatmentPlan.destroy({
        where: { DiagnosisId: diagnosisIds },
        transaction,
      });

      // Delete diagnoses created on the same date as the session (compare date portion only)
      await Diagnosis.destroy({
        where: {
          PatientId: patientId,
          TherapistId: therapistId,
          DiagnosisDate: {
            [Op.gte]: new Date(sessionDate),
            [Op.lt]: new Date(new Date(sessionDate).getTime() + 86400000), // sessionDate + 1 day
          },
        },
        transaction,
      });
    }

    // Delete session (cascades to SessionNotes via FK)
    await Session.destroy({ where: { Id: sessionId }, transaction });

    await transaction.commit();

    return res.status(200).json({
      message: 'Session and related records deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete session.',
    });
  }
};
