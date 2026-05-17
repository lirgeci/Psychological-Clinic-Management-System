const { AbsenceRequest, Therapist, sequelize } = require('../models');

const REQUIRED_FIELDS = ['fromDate', 'toDate', 'reason'];
const ALLOWED_STATUSES = ['Pending', 'Approved', 'Rejected'];

const getCurrentTherapist = async (userId) => {
  return Therapist.findOne({ where: { UserId: userId } });
};

exports.createAbsenceRequest = async (req, res) => {
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

    const therapist = await getCurrentTherapist(userId);
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found.' });
    }

    const absenceRequest = await AbsenceRequest.create({
      TherapistId: therapist.Id,
      FromDate: req.body.fromDate,
      ToDate: req.body.toDate,
      Reason: req.body.reason,
      Status: 'Pending',
      CreatedAt: new Date(),
    });

    return res.status(201).json({
      message: 'Absence request created successfully.',
      absenceRequest,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create absence request.',
    });
  }
};

exports.getAllAbsenceRequests = async (_req, res) => {
  try {
    const absenceRequests = await AbsenceRequest.findAll({
      include: [
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      order: [['CreatedAt', 'DESC']],
    });

    return res.status(200).json({ absenceRequests });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch absence requests.',
    });
  }
};

exports.getMyAbsenceRequests = async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Invalid user identity.' });
    }

    const therapist = await getCurrentTherapist(userId);
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found.' });
    }

    const absenceRequests = await AbsenceRequest.findAll({
      where: { TherapistId: therapist.Id },
      include: [
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      order: [['CreatedAt', 'DESC']],
    });

    return res.status(200).json({ absenceRequests });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch your absence requests.',
    });
  }
};

exports.getAbsenceRequestById = async (req, res) => {
  try {
    const absenceRequestId = Number(req.params.id);
    if (!Number.isInteger(absenceRequestId) || absenceRequestId < 1) {
      return res.status(400).json({ message: 'Invalid absence request id format.' });
    }

    const absenceRequest = await AbsenceRequest.findByPk(absenceRequestId, {
      include: [
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
    });

    if (!absenceRequest) {
      return res.status(404).json({ message: 'Absence request not found.' });
    }

    const roleId = Number(req.user?.roleId || 0);
    if (roleId === 2) {
      const therapist = await getCurrentTherapist(Number(req.user?.userId));
      if (!therapist || Number(therapist.Id) !== Number(absenceRequest.TherapistId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    return res.status(200).json(absenceRequest);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch absence request.',
    });
  }
};

exports.updateAbsenceRequest = async (req, res) => {
  let transaction;

  try {
    const absenceRequestId = Number(req.params.id);
    if (!Number.isInteger(absenceRequestId) || absenceRequestId < 1) {
      return res.status(400).json({ message: 'Invalid absence request id format.' });
    }

    const { status } = req.body;
    if (status === undefined || String(status).trim() === '') {
      return res.status(400).json({ message: 'Status is required.' });
    }

    if (!ALLOWED_STATUSES.includes(String(status))) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    transaction = await sequelize.transaction();

    const existingAbsenceRequest = await AbsenceRequest.findByPk(absenceRequestId, { transaction });
    if (!existingAbsenceRequest) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Absence request not found.' });
    }

    await AbsenceRequest.update(
      { Status: status },
      {
        where: { Id: absenceRequestId },
        transaction,
      }
    );

    const updatedAbsenceRequest = await AbsenceRequest.findByPk(absenceRequestId, {
      include: [
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: 'Absence request updated successfully.',
      absenceRequest: updatedAbsenceRequest,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update absence request.',
    });
  }
};

exports.deleteAbsenceRequest = async (req, res) => {
  let transaction;

  try {
    const absenceRequestId = Number(req.params.id);
    if (!Number.isInteger(absenceRequestId) || absenceRequestId < 1) {
      return res.status(400).json({ message: 'Invalid absence request id format.' });
    }

    transaction = await sequelize.transaction();

    const existingAbsenceRequest = await AbsenceRequest.findByPk(absenceRequestId, { transaction });
    if (!existingAbsenceRequest) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Absence request not found.' });
    }

    await AbsenceRequest.destroy({ where: { Id: absenceRequestId }, transaction });
    await transaction.commit();

    return res.status(200).json({ message: 'Absence request deleted successfully.' });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete absence request.',
    });
  }
};