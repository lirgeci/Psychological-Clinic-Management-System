const { Questionnaire, QuestionnaireResponse, sequelize } = require('../models');

const REQUIRED_FIELDS = ['title'];

exports.createQuestionnaire = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  const { title, description, type, questionsJson, createdDate } = req.body;

  try {
    const questionnaire = await Questionnaire.create({
      Title: title,
      Description: description || null,
      Type: type || null,
      QuestionsJson: questionsJson || null,
      CreatedDate: createdDate || new Date(),
    });

    return res.status(201).json({
      message: 'Questionnaire created successfully.',
      questionnaire,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create questionnaire.',
    });
  }
};

exports.getAllQuestionnaires = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await Questionnaire.count();
    const questionnaires = await Questionnaire.findAll({
      offset,
      limit,
      include: [
        {
          model: QuestionnaireResponse,
          as: 'QuestionnaireResponses',
        },
      ],
      order: [['CreatedDate', 'DESC']],
    });

    if (!questionnaires || questionnaires.length === 0) {
      return res.status(404).json({ message: 'No questionnaires found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      questionnaires,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch questionnaires.',
    });
  }
};

exports.getQuestionnaireById = async (req, res) => {
  try {
    const questionnaireId = Number(req.params.questionnaireId);
    if (!Number.isInteger(questionnaireId) || questionnaireId < 1) {
      return res.status(400).json({ message: 'Invalid questionnaireId format.' });
    }

    const questionnaire = await Questionnaire.findByPk(questionnaireId, {
      include: [
        {
          model: QuestionnaireResponse,
          as: 'QuestionnaireResponses',
        },
      ],
    });

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found.' });
    }

    return res.status(200).json(questionnaire);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch questionnaire.',
    });
  }
};

exports.updateQuestionnaire = async (req, res) => {
  let transaction;

  try {
    const questionnaireId = Number(req.params.questionnaireId);
    if (!Number.isInteger(questionnaireId) || questionnaireId < 1) {
      return res.status(400).json({ message: 'Invalid questionnaireId format.' });
    }

    const { title, description, type, questionsJson } = req.body;

    if (
      title === undefined &&
      description === undefined &&
      type === undefined &&
      questionsJson === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();
    const existingQuestionnaire = await Questionnaire.findByPk(questionnaireId, {
      transaction,
    });

    if (!existingQuestionnaire) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Questionnaire not found.' });
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.Title = title;
    if (description !== undefined) updatePayload.Description = description;
    if (type !== undefined) updatePayload.Type = type;
    if (questionsJson !== undefined) updatePayload.QuestionsJson = questionsJson;

    await Questionnaire.update(updatePayload, {
      where: { Id: questionnaireId },
      transaction,
    });

    const updatedQuestionnaire = await Questionnaire.findByPk(questionnaireId, {
      include: [
        {
          model: QuestionnaireResponse,
          as: 'QuestionnaireResponses',
        },
      ],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: 'Questionnaire updated successfully.',
      questionnaire: updatedQuestionnaire,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update questionnaire.',
    });
  }
};

exports.deleteQuestionnaire = async (req, res) => {
  let transaction;

  try {
    const questionnaireId = Number(req.params.questionnaireId);
    if (!Number.isInteger(questionnaireId) || questionnaireId < 1) {
      return res.status(400).json({ message: 'Invalid questionnaireId format.' });
    }

    transaction = await sequelize.transaction();
    const existingQuestionnaire = await Questionnaire.findByPk(questionnaireId, {
      transaction,
    });

    if (!existingQuestionnaire) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Questionnaire not found.' });
    }

    await Questionnaire.destroy({ where: { Id: questionnaireId }, transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Questionnaire deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete questionnaire due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete questionnaire.',
    });
  }
};
