const bcrypt = require('bcryptjs');
const { User, Patient, UserRole, sequelize } = require('../models');

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

exports.register = async (req, res) => {
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
    // Start one transaction so User + Patient are created atomically.
    transaction = await sequelize.transaction();

    // Ensure email is unique in Users before creating a new account.
    const existingUser = await User.findOne({
      where: { Email: email },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    // Hash password using bcrypt with cost factor 12.
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the identity record in Users.
    const user = await User.create(
      {
        Email: email,
        PasswordHash: passwordHash,
      },
      { transaction }
    );

    // Create Patient profile mapped from frontend payload to DB columns.
    await Patient.create(
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

    // Assign default Patient role to the newly registered user.
    await UserRole.create(
      {
        UserId: user.Id,
        RoleId: 3,
      },
      { transaction }
    );

    // Persist both inserts together.
    await transaction.commit();

    return res.status(201).json({
      message: 'User registered successfully.',
      userId: user.Id,
    });
  } catch (error) {
    // Roll back if any step fails inside the transaction.
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Registration failed.',
    });
  }
};
