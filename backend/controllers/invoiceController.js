const { Invoice, Patient, Session, sequelize } = require('../models');

const REQUIRED_FIELDS = ['amount', 'finalAmount', 'patientId', 'sessionId'];

exports.createInvoice = async (req, res) => {
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
    amount,
    discount,
    finalAmount,
    invoiceDate,
    paymentStatus,
    patientId,
    sessionId,
  } = req.body;

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const patient = await Patient.findByPk(patientId, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const session = await Session.findByPk(sessionId, { transaction });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Session not found.' });
    }

    const invoice = await Invoice.create(
      {
        Amount: amount,
        Discount: discount || 0.00,
        FinalAmount: finalAmount,
        InvoiceDate: invoiceDate || new Date(),
        PaymentStatus: paymentStatus || 'Pending',
        PatientId: patientId,
        SessionId: sessionId,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: 'Invoice created successfully.',
      invoice,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to create invoice.',
    });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await Invoice.count();
    const invoices = await Invoice.findAll({
      offset,
      limit,
      include: [
        { model: Patient },
        { model: Session },
      ],
      order: [['InvoiceDate', 'DESC']],
    });

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch invoices.',
    });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) {
      return res.status(400).json({ message: 'Invalid invoiceId format.' });
    }

    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        { model: Patient },
        { model: Session },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    return res.status(200).json(invoice);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch invoice.',
    });
  }
};

exports.updateInvoice = async (req, res) => {
  let transaction;

  try {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) {
      return res.status(400).json({ message: 'Invalid invoiceId format.' });
    }

    const {
      amount,
      discount,
      finalAmount,
      invoiceDate,
      paymentStatus,
    } = req.body;

    if (
      amount === undefined &&
      discount === undefined &&
      finalAmount === undefined &&
      invoiceDate === undefined &&
      paymentStatus === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();
    const existingInvoice = await Invoice.findByPk(invoiceId, { transaction });

    if (!existingInvoice) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    const updatePayload = {};
    if (amount !== undefined) updatePayload.Amount = amount;
    if (discount !== undefined) updatePayload.Discount = discount;
    if (finalAmount !== undefined) updatePayload.FinalAmount = finalAmount;
    if (invoiceDate !== undefined) updatePayload.InvoiceDate = invoiceDate;
    if (paymentStatus !== undefined) updatePayload.PaymentStatus = paymentStatus;

    await Invoice.update(updatePayload, {
      where: { Id: invoiceId },
      transaction,
    });

    const updatedInvoice = await Invoice.findByPk(invoiceId, {
      include: [
        { model: Patient },
        { model: Session },
      ],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: 'Invoice updated successfully.',
      invoice: updatedInvoice,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update invoice.',
    });
  }
};

exports.deleteInvoice = async (req, res) => {
  let transaction;

  try {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) {
      return res.status(400).json({ message: 'Invalid invoiceId format.' });
    }

    transaction = await sequelize.transaction();
    const existingInvoice = await Invoice.findByPk(invoiceId, { transaction });

    if (!existingInvoice) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    await Invoice.destroy({ where: { Id: invoiceId }, transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete invoice due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete invoice.',
    });
  }
};
