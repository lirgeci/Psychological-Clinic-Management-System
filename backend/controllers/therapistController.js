const bcrypt = require('bcryptjs');
const { Therapist, User, Appointment, UserRole, sequelize } = require('../models');

const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'specialization',
  'licenseNumber',
  'password',
];

exports.createTherapist = async (req, res) => {
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
    firstName,
    lastName,
    email,
    phone,
    specialization,
    licenseNumber,
    qualifications,
    employmentDate,
    biography,
    password,
  } = req.body;

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const existingUser = await User.findOne({
      where: { Email: email },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create(
      {
        Email: email,
        PasswordHash: passwordHash,
      },
      { transaction }
    );

    const therapist = await Therapist.create(
      {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: phone,
        Specialization: specialization,
        LicenseNumber: licenseNumber,
        Qualifications: qualifications,
        EmploymentDate: employmentDate,
        Biography: biography,
        UserId: user.Id,
      },
      { transaction }
    );

    await UserRole.create(
      {
        UserId: user.Id,
        RoleId: 2, // Assuming therapist role is 2
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: 'Therapist created successfully.',
      therapist: {
        id: therapist.Id,
        firstName: therapist.FirstName,
        lastName: therapist.LastName,
        email: therapist.Email,
        phone: therapist.Phone,
        specialization: therapist.Specialization,
        licenseNumber: therapist.LicenseNumber,
        userId: user.Id,
      },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to create therapist.',
    });
  }
};

exports.getAllTherapists = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;

    const total = await Therapist.count();
    const therapists = await Therapist.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['Id', 'Email'],
        },
      ],
      offset,
      limit,
      order: [['UserId', 'ASC']],
    });

    if (!therapists || therapists.length === 0) {
      return res.status(404).json({ message: 'No therapists found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      therapists,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch therapists.',
    });
  }
};

exports.getTherapistById = async (req, res) => {
  try {
    const therapistId = Number(req.params.therapistId);
    if (!Number.isInteger(therapistId) || therapistId < 1) {
      return res.status(400).json({ message: 'Invalid therapistId format.' });
    }

    const therapist = await Therapist.findByPk(therapistId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['Id', 'Email'],
        },
      ],
    });

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found.' });
    }

    return res.status(200).json(therapist);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch therapist.',
    });
  }
};

exports.updateTherapist = async (req, res) => {
  let transaction;

  try {
    const therapistId = Number(req.params.therapistId);
    if (!Number.isInteger(therapistId) || therapistId < 1) {
      return res.status(400).json({ message: 'Invalid therapistId format.' });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      specialization,
      licenseNumber,
      qualifications,
      employmentDate,
      biography,
      password,
    } = req.body;

    if (
      firstName === undefined &&
      lastName === undefined &&
      email === undefined &&
      phone === undefined &&
      specialization === undefined &&
      licenseNumber === undefined &&
      qualifications === undefined &&
      employmentDate === undefined &&
      biography === undefined &&
      (password === undefined || String(password).trim() === '')
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();

    const existingTherapist = await Therapist.findByPk(therapistId, { transaction });
    if (!existingTherapist) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Therapist not found.' });
    }

    const updatePayload = {};

    if (firstName !== undefined) updatePayload.FirstName = firstName;
    if (lastName !== undefined) updatePayload.LastName = lastName;
    if (phone !== undefined) updatePayload.Phone = phone;
    if (specialization !== undefined) updatePayload.Specialization = specialization;
    if (licenseNumber !== undefined) updatePayload.LicenseNumber = licenseNumber;
    if (qualifications !== undefined) updatePayload.Qualifications = qualifications;
    if (employmentDate !== undefined) updatePayload.EmploymentDate = employmentDate;
    if (biography !== undefined) updatePayload.Biography = biography;

    await Therapist.update(updatePayload, {
      where: { Id: therapistId },
      transaction,
    });

    if (email !== undefined) {
      await User.update(
        { Email: email },
        {
          where: { Id: existingTherapist.UserId },
          transaction,
        }
      );

      await Therapist.update(
        { Email: email },
        {
          where: { Id: therapistId },
          transaction,
        }
      );
    }

    if (password !== undefined && String(password).trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 12);

      await User.update(
        { PasswordHash: passwordHash },
        {
          where: { Id: existingTherapist.UserId },
          transaction,
        }
      );
    }

    const updatedTherapist = await Therapist.findByPk(therapistId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['Id', 'Email'],
        },
      ],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: 'Therapist updated successfully.',
      therapist: updatedTherapist,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update therapist.',
    });
  }
};

exports.deleteTherapist = async (req, res) => {
  let transaction;

  try {
    const therapistId = Number(req.params.therapistId);
    if (!Number.isInteger(therapistId) || therapistId < 1) {
      return res.status(400).json({ message: 'Invalid therapistId format.' });
    }

    transaction = await sequelize.transaction();

    const existingTherapist = await Therapist.findByPk(therapistId, { transaction });
    if (!existingTherapist) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Therapist not found.' });
    }

    const userId = existingTherapist.UserId;

    // Delete therapist record first
    await Therapist.destroy({ where: { Id: therapistId }, transaction });

    // Delete associated user role assignments
    await UserRole.destroy({ where: { UserId: userId }, transaction });

    // Delete the user record
    await User.destroy({ where: { Id: userId }, transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Therapist and associated user deleted successfully',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete therapist due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete therapist.',
    });
  }
};

exports.getTherapistAppointments = async (req, res) => {
  try {
    const therapistId = Number(req.params.therapistId);
    if (!Number.isInteger(therapistId) || therapistId < 1) {
      return res.status(400).json({ message: 'Invalid therapistId format.' });
    }

    const appointments = await Appointment.findAll({
      where: { TherapistId: therapistId },
      order: [['AppointmentDate', 'ASC'], ['AppointmentTime', 'ASC']],
    });

    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch therapist appointments.',
    });
  }
};