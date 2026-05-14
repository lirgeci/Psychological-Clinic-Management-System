const { QuestionnaireResponse, Patient, Questionnaire, sequelize } = require('../models');

const REQUIRED_FIELDS = ['responsesJson', 'patientId', 'questionnaireId'];

exports.createQuestionnaireResponse = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  const { responsesJson, totalScore, completionDate, patientId, questionnaireId } = req.body;

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const patient = await Patient.findByPk(patientId, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const questionnaire = await Questionnaire.findByPk(questionnaireId, { transaction });
    if (!questionnaire) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Questionnaire not found.' });
    }

    const questionnaireResponse = await QuestionnaireResponse.create(
      {
        AnswersJson: responsesJson,
        TotalScore: totalScore || null,
        CompletedDate: completionDate || new Date(),
        PatientId: patientId,
        QuestionnaireId: questionnaireId,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: 'Questionnaire response created successfully.',
      questionnaireResponse,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to create questionnaire response.',
    });
  }
};

exports.getAllQuestionnaireResponses = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await QuestionnaireResponse.count();
    const questionnaireResponses = await QuestionnaireResponse.findAll({
      offset,
      limit,
      include: [
        { model: Patient },
        { model: Questionnaire },
      ],
      order: [['CompletedDate', 'DESC']],
    });

    if (!questionnaireResponses || questionnaireResponses.length === 0) {
      return res.status(404).json({ message: 'No questionnaire responses found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      questionnaireResponses,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch questionnaire responses.',
    });
  }
};

exports.getQuestionnaireResponseById = async (req, res) => {
  try {
    const responseId = Number(req.params.responseId);
    if (!Number.isInteger(responseId) || responseId < 1) {
      return res.status(400).json({ message: 'Invalid responseId format.' });
    }

    const questionnaireResponse = await QuestionnaireResponse.findByPk(responseId, {
      include: [
        { model: Patient },
        { model: Questionnaire },
      ],
    });

    if (!questionnaireResponse) {
      return res.status(404).json({ message: 'Questionnaire response not found.' });
    }

    return res.status(200).json(questionnaireResponse);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch questionnaire response.',
    });
  }
};

exports.updateQuestionnaireResponse = async (req, res) => {
  let transaction;

  try {
    const responseId = Number(req.params.responseId);
    if (!Number.isInteger(responseId) || responseId < 1) {
      return res.status(400).json({ message: 'Invalid responseId format.' });
    }

    const { responsesJson, totalScore, completionDate } = req.body;

    if (responsesJson === undefined && totalScore === undefined && completionDate === undefined) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();
    const existingResponse = await QuestionnaireResponse.findByPk(responseId, { transaction });

    if (!existingResponse) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Questionnaire response not found.' });
    }

    const updatePayload = {};
    if (responsesJson !== undefined) updatePayload.AnswersJson = responsesJson;
    if (totalScore !== undefined) updatePayload.TotalScore = totalScore;
    if (completionDate !== undefined) updatePayload.CompletedDate = completionDate;

    await QuestionnaireResponse.update(updatePayload, {
      where: { Id: responseId },
      transaction,
    });

    const updatedResponse = await QuestionnaireResponse.findByPk(responseId, {
      include: [
        { model: Patient },
        { model: Questionnaire },
      ],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: 'Questionnaire response updated successfully.',
      questionnaireResponse: updatedResponse,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update questionnaire response.',
    });
  }
};

exports.deleteQuestionnaireResponse = async (req, res) => {
  let transaction;

  try {
    const responseId = Number(req.params.responseId);
    if (!Number.isInteger(responseId) || responseId < 1) {
      return res.status(400).json({ message: 'Invalid responseId format.' });
    }

    transaction = await sequelize.transaction();
    const existingResponse = await QuestionnaireResponse.findByPk(responseId, { transaction });

    if (!existingResponse) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Questionnaire response not found.' });
    }

    await QuestionnaireResponse.destroy({ where: { Id: responseId }, transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Questionnaire response deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete questionnaire response due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete questionnaire response.',
    });
  }

};