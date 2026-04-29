const bcrypt = require('bcryptjs');
const { Patient, User, Appointment, UserRole, sequelize } = require('../models');

const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'gender',
  'address',
  'emergencyContact',
  'password',
];

exports.createPatient = async (req, res) => {
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
    dateOfBirth,
    gender,
    address,
    emergencyContact,
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

    const patient = await Patient.create(
      {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: phone,
        DateOfBirth: dateOfBirth,
        Gender: gender,
        Address: address,
        EmergencyContact: emergencyContact,
        RegistrationDate: new Date(),
        UserId: user.Id,
      },
      { transaction }
    );

    await UserRole.create(
      {
        UserId: user.Id,
        RoleId: 3,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: 'Patient created successfully.',
      patient: {
        id: patient.Id,
        firstName: patient.FirstName,
        lastName: patient.LastName,
        email: patient.Email,
        phone: patient.Phone,
        userId: user.Id,
      },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to create patient.',
    });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;

    const total = await Patient.count();
    const patients = await Patient.findAll({
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

    if (!patients || patients.length === 0) {
      return res.status(404).json({ message: 'No patients found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      patients,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch patients.',
    });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId < 1) {
      return res.status(400).json({ message: 'Invalid patientId format.' });
    }

    const patient = await Patient.findByPk(patientId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['Id', 'Email'],
        },
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch patient.',
    });
  }
};

exports.updatePatient = async (req, res) => {
  let transaction;

  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId < 1) {
      return res.status(400).json({ message: 'Invalid patientId format.' });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      password,
    } = req.body;

    if (
      firstName === undefined &&
      lastName === undefined &&
      email === undefined &&
      phone === undefined &&
      dateOfBirth === undefined &&
      gender === undefined &&
      address === undefined &&
      emergencyContact === undefined &&
      (password === undefined || String(password).trim() === '')
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();

    const existingPatient = await Patient.findByPk(patientId, { transaction });
    if (!existingPatient) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const updatePayload = {};

    if (firstName !== undefined) updatePayload.FirstName = firstName;
    if (lastName !== undefined) updatePayload.LastName = lastName;
    if (phone !== undefined) updatePayload.Phone = phone;
    if (dateOfBirth !== undefined) updatePayload.DateOfBirth = dateOfBirth;
    if (gender !== undefined) updatePayload.Gender = gender;
    if (address !== undefined) updatePayload.Address = address;
    if (emergencyContact !== undefined) updatePayload.EmergencyContact = emergencyContact;

    await Patient.update(updatePayload, {
      where: { Id: patientId },
      transaction,
    });

    if (email !== undefined) {
      await User.update(
        { Email: email },
        {
          where: { Id: existingPatient.UserId },
          transaction,
        }
      );

      await Patient.update(
        { Email: email },
        {
          where: { Id: patientId },
          transaction,
        }
      );
    }

    if (password !== undefined && String(password).trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 12);

      await User.update(
        { PasswordHash: passwordHash },
        {
          where: { Id: existingPatient.UserId },
          transaction,
        }
      );
    }

    const updatedPatient = await Patient.findByPk(patientId, {
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
      message: 'Patient updated successfully.',
      patient: updatedPatient,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update patient.',
    });
  }
};

exports.deletePatient = async (req, res) => {
  let transaction;

  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId < 1) {
      return res.status(400).json({ message: 'Invalid patientId format.' });
    }

    transaction = await sequelize.transaction();

    const existingPatient = await Patient.findByPk(patientId, { transaction });
    if (!existingPatient) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const userId = existingPatient.UserId;

    // Delete patient record first
    await Patient.destroy({ where: { Id: patientId }, transaction });

    // Delete associated user role assignments
    await UserRole.destroy({ where: { UserId: userId }, transaction });

    // Delete the user record
    await User.destroy({ where: { Id: userId }, transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Patient and associated user deleted successfully',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete patient due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete patient.',
    });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId < 1) {
      return res.status(400).json({ message: 'Invalid patientId format.' });
    }

    const appointments = await Appointment.findAll({
      where: { PatientId: patientId },
      order: [['AppointmentDate', 'ASC'], ['AppointmentTime', 'ASC']],
    });

    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch patient appointments.',
    });
  }
};