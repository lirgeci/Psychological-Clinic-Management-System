const { Diagnosis, Patient, Therapist, TreatmentPlan, sequelize } = require('../models');

const REQUIRED_FIELDS = ['diagnosisCode', 'name', 'diagnosisDate', 'severity', 'patientId', 'therapistId'];

exports.createDiagnosis = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  const { diagnosisCode, name, description, diagnosisDate, severity, patientId, therapistId } = req.body;

  try {
    const diagnosis = await Diagnosis.create({
      DiagnosisCode: diagnosisCode,
      Name: name,
      Description: description || null,
      DiagnosisDate: diagnosisDate,
      Severity: severity,
      PatientId: patientId,
      TherapistId: therapistId,
    });

    return res.status(201).json({
      message: 'Diagnosis created successfully.',
      diagnosis,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create diagnosis.',
    });
  }
};

exports.getAllDiagnoses = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await Diagnosis.count();
    const diagnoses = await Diagnosis.findAll({
      offset,
      limit,
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          as: 'Therapist',
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      order: [['DiagnosisDate', 'DESC']],
    });

    if (!diagnoses || diagnoses.length === 0) {
      return res.status(404).json({ message: 'No diagnoses found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      diagnoses,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch diagnoses.',
    });
  }
};

exports.getDiagnosisById = async (req, res) => {
  try {
    const diagnosisId = Number(req.params.diagnosisId);
    if (!Number.isInteger(diagnosisId) || diagnosisId < 1) {
      return res.status(400).json({ message: 'Invalid diagnosisId format.' });
    }

    const diagnosis = await Diagnosis.findByPk(diagnosisId, {
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          as: 'Therapist',
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: TreatmentPlan,
          as: 'TreatmentPlans',
        },
      ],
    });

    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found.' });
    }

    return res.status(200).json(diagnosis);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch diagnosis.',
    });
  }
};

exports.updateDiagnosis = async (req, res) => {
  let transaction;

  try {
    const diagnosisId = Number(req.params.diagnosisId);
    if (!Number.isInteger(diagnosisId) || diagnosisId < 1) {
      return res.status(400).json({ message: 'Invalid diagnosisId format.' });
    }

    const { diagnosisCode, name, description, diagnosisDate, severity } = req.body;

    if (
      diagnosisCode === undefined &&
      name === undefined &&
      description === undefined &&
      diagnosisDate === undefined &&
      severity === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();
    const existingDiagnosis = await Diagnosis.findByPk(diagnosisId, { transaction });

    if (!existingDiagnosis) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Diagnosis not found.' });
    }

    const updatePayload = {};
    if (diagnosisCode !== undefined) updatePayload.DiagnosisCode = diagnosisCode;
    if (name !== undefined) updatePayload.Name = name;
    if (description !== undefined) updatePayload.Description = description;
    if (diagnosisDate !== undefined) updatePayload.DiagnosisDate = diagnosisDate;
    if (severity !== undefined) updatePayload.Severity = severity;

    await Diagnosis.update(updatePayload, {
      where: { Id: diagnosisId },
      transaction,
    });

    const updatedDiagnosis = await Diagnosis.findByPk(diagnosisId, {
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          as: 'Therapist',
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
      ],
      transaction,
    });
    await transaction.commit();

    return res.status(200).json({
      message: 'Diagnosis updated successfully.',
      diagnosis: updatedDiagnosis,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update diagnosis.',
    });
  }
};

exports.deleteDiagnosis = async (req, res) => {
  let transaction;

  try {
    const diagnosisId = Number(req.params.diagnosisId);
    if (!Number.isInteger(diagnosisId) || diagnosisId < 1) {
      return res.status(400).json({ message: 'Invalid diagnosisId format.' });
    }

    transaction = await sequelize.transaction();
    const existingDiagnosis = await Diagnosis.findByPk(diagnosisId, { transaction });

    if (!existingDiagnosis) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Diagnosis not found.' });
    }

    await Diagnosis.destroy({ where: { Id: diagnosisId }, transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Diagnosis deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete diagnosis due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete diagnosis.',
    });
  }
};
