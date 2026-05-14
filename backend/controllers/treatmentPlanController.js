const { TreatmentPlan, Patient, Therapist, Diagnosis, sequelize } = require('../models');

const REQUIRED_FIELDS = ['name', 'objectives', 'startDate', 'status', 'patientId', 'therapistId', 'diagnosisId'];

exports.createTreatmentPlan = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  const { name, objectives, startDate, endDate, status, patientId, therapistId, diagnosisId } = req.body;

  try {
    const treatmentPlan = await TreatmentPlan.create({
      Name: name,
      Objectives: objectives,
      StartDate: startDate,
      EndDate: endDate || null,
      Status: status,
      PatientId: patientId,
      TherapistId: therapistId,
      DiagnosisId: diagnosisId,
    });

    return res.status(201).json({
      message: 'Treatment plan created successfully.',
      treatmentPlan,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create treatment plan.',
    });
  }
};

exports.getAllTreatmentPlans = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await TreatmentPlan.count();
    const treatmentPlans = await TreatmentPlan.findAll({
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
        {
          model: Diagnosis,
          as: 'Diagnosis',
          attributes: ['Id', 'Name', 'DiagnosisCode'],
        },
      ],
      order: [['StartDate', 'DESC']],
    });

    if (!treatmentPlans || treatmentPlans.length === 0) {
      return res.status(404).json({ message: 'No treatment plans found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      treatmentPlans,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch treatment plans.',
    });
  }
};

exports.getTreatmentPlanById = async (req, res) => {
  try {
    const treatmentPlanId = Number(req.params.treatmentPlanId);
    if (!Number.isInteger(treatmentPlanId) || treatmentPlanId < 1) {
      return res.status(400).json({ message: 'Invalid treatmentPlanId format.' });
    }

    const treatmentPlan = await TreatmentPlan.findByPk(treatmentPlanId, {
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
          model: Diagnosis,
          as: 'Diagnosis',
          attributes: ['Id', 'Name', 'DiagnosisCode', 'Description'],
        },
      ],
    });

    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found.' });
    }

    return res.status(200).json(treatmentPlan);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch treatment plan.',
    });
  }
};

exports.updateTreatmentPlan = async (req, res) => {
  let transaction;

  try {
    const treatmentPlanId = Number(req.params.treatmentPlanId);
    if (!Number.isInteger(treatmentPlanId) || treatmentPlanId < 1) {
      return res.status(400).json({ message: 'Invalid treatmentPlanId format.' });
    }

    const { name, objectives, startDate, endDate, status } = req.body;

    if (
      name === undefined &&
      objectives === undefined &&
      startDate === undefined &&
      endDate === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();
    const existingTreatmentPlan = await TreatmentPlan.findByPk(treatmentPlanId, { transaction });

    if (!existingTreatmentPlan) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Treatment plan not found.' });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.Name = name;
    if (objectives !== undefined) updatePayload.Objectives = objectives;
    if (startDate !== undefined) updatePayload.StartDate = startDate;
    if (endDate !== undefined) updatePayload.EndDate = endDate;
    if (status !== undefined) updatePayload.Status = status;

    await TreatmentPlan.update(updatePayload, {
      where: { Id: treatmentPlanId },
      transaction,
    });

    const updatedTreatmentPlan = await TreatmentPlan.findByPk(treatmentPlanId, {
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
          model: Diagnosis,
          as: 'Diagnosis',
          attributes: ['Id', 'Name', 'DiagnosisCode'],
        },
      ],
      transaction,
    });
    await transaction.commit();

    return res.status(200).json({
      message: 'Treatment plan updated successfully.',
      treatmentPlan: updatedTreatmentPlan,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update treatment plan.',
    });
  }
};

exports.deleteTreatmentPlan = async (req, res) => {
  let transaction;

  try {
    const treatmentPlanId = Number(req.params.treatmentPlanId);
    if (!Number.isInteger(treatmentPlanId) || treatmentPlanId < 1) {
      return res.status(400).json({ message: 'Invalid treatmentPlanId format.' });
    }

    transaction = await sequelize.transaction();
    const existingTreatmentPlan = await TreatmentPlan.findByPk(treatmentPlanId, { transaction });

    if (!existingTreatmentPlan) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Treatment plan not found.' });
    }

    await TreatmentPlan.destroy({ where: { Id: treatmentPlanId }, transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Treatment plan deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete treatment plan due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete treatment plan.',
    });
  }
};
