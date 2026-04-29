const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Patient, Therapist, UserRole, sequelize } = require('../models');

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

exports.getAllUsers = async (req, res) => {
  try {
    // Method-level validation for pagination query params.
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;

    // Count + fetch users while excluding password hash from the response.
    const total = await User.count();
    const users = await User.findAll({
      attributes: { exclude: ['PasswordHash'] },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          attributes: ['RoleId'],
          required: false,
          include: [
            {
              association: 'role',
              attributes: ['Name'],
            },
          ],
        },
      ],
      offset,
      limit,
      order: [['Id', 'ASC']],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found.' });
    }

    const userIds = users.map((user) => user.Id);

    const patients = await Patient.findAll({
      where: { UserId: userIds },
      attributes: ['UserId', 'FirstName', 'LastName', 'Phone'],
    });

    const therapists = await Therapist.findAll({
      where: { UserId: userIds },
      attributes: ['UserId', 'FirstName', 'LastName', 'Phone'],
    });

    const patientByUserId = new Map(patients.map((patient) => [patient.UserId, patient]));
    const therapistByUserId = new Map(therapists.map((therapist) => [therapist.UserId, therapist]));

    const usersWithProfile = users.map((user) => {
      const plainUser = user.toJSON();
      const patient = patientByUserId.get(user.Id) || null;
      const therapist = therapistByUserId.get(user.Id) || null;
      const profile = patient || therapist;
      const userRoleName =
        plainUser.userRoles && plainUser.userRoles.length > 0 && plainUser.userRoles[0].role
          ? plainUser.userRoles[0].role.Name
          : null;

      return {
        ...plainUser,
        firstName: profile ? profile.FirstName : null,
        lastName: profile ? profile.LastName : null,
        phoneNumber: profile ? profile.Phone : null,
        role: userRoleName,
      };
    });

    return res.status(200).json({
      count: total,
      page,
      limit,
      users: usersWithProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch users.',
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    // Method-level validation for user id.
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Invalid userId format.' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['PasswordHash'] },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          attributes: ['RoleId'],
          required: false,
          include: [
            {
              association: 'role',
              attributes: ['Name'],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const patient = await Patient.findOne({
      where: { UserId: userId },
      attributes: ['FirstName', 'LastName', 'Phone'],
    });

    const therapist = await Therapist.findOne({
      where: { UserId: userId },
      attributes: ['FirstName', 'LastName', 'Phone'],
    });

    const profile = patient || therapist;

    const userWithProfile = {
      ...user.toJSON(),
      firstName: profile ? profile.FirstName : null,
      lastName: profile ? profile.LastName : null,
      phoneNumber: profile ? profile.Phone : null,
      role:
        user.userRoles && user.userRoles.length > 0 && user.userRoles[0].role
          ? user.userRoles[0].role.Name
          : null,
    };

    return res.status(200).json(userWithProfile);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch user.',
    });
  }
};

exports.updateUser = async (req, res) => {
  let transaction;

  try {
    // Method-level validation for id and payload.
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Invalid userId format.' });
    }

    const email = req.body.email ?? req.body.Email;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone ?? req.body.phoneNumber;
    if (
      email === undefined &&
      password === undefined &&
      firstName === undefined &&
      lastName === undefined &&
      phone === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided: email, firstName, lastName, phone, or password.',
      });
    }

    transaction = await sequelize.transaction();

    const existingUser = await User.findByPk(userId, { transaction });
    if (!existingUser) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }

    // Enforce unique email only when email is being changed.
    if (email !== undefined && email !== existingUser.Email) {
      const matchedUsers = await User.findAll({
        where: { Email: email },
        transaction,
      });

      if (matchedUsers.length > 0) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Email is already in use.' });
      }
    }

    const updatePayload = {};
    const profilePayload = {};

    if (email !== undefined) {
      updatePayload.Email = email;
    }

    if (firstName !== undefined) {
      profilePayload.FirstName = firstName;
    }

    if (lastName !== undefined) {
      profilePayload.LastName = lastName;
    }

    if (phone !== undefined) {
      profilePayload.Phone = phone;
    }

    if (password !== undefined && String(password).trim() !== '') {
      try {
        updatePayload.PasswordHash = await bcrypt.hash(password, 12);
      } catch (hashError) {
        await transaction.rollback();
        return res.status(500).json({
          message: hashError.message || 'Password hashing failed.',
        });
      }
    }

    await User.update(updatePayload, {
      where: { Id: userId },
      transaction,
    });

    if (email !== undefined) {
      await Patient.update(
        { Email: email },
        {
          where: { UserId: userId },
          transaction,
        }
      );

      await Therapist.update(
        { Email: email },
        {
          where: { UserId: userId },
          transaction,
        }
      );
    }

    if (Object.keys(profilePayload).length > 0) {
      await Patient.update(profilePayload, {
        where: { UserId: userId },
        transaction,
      });

      await Therapist.update(profilePayload, {
        where: { UserId: userId },
        transaction,
      });
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['PasswordHash'] },
      transaction,
    });

    const patient = await Patient.findOne({
      where: { UserId: userId },
      attributes: ['FirstName', 'LastName', 'Phone'],
      transaction,
    });

    const therapist = await Therapist.findOne({
      where: { UserId: userId },
      attributes: ['FirstName', 'LastName', 'Phone'],
      transaction,
    });

    const profile = patient || therapist;

    const updatedUserWithProfile = {
      ...updatedUser.toJSON(),
      firstName: profile ? profile.FirstName : null,
      lastName: profile ? profile.LastName : null,
      phoneNumber: profile ? profile.Phone : null,
    };

    await transaction.commit();

    return res.status(200).json({
      message: 'User updated successfully.',
      user: updatedUserWithProfile,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update user.',
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Method-level validation for id.
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Invalid userId format.' });
    }

    const existingUser = await User.findByPk(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await User.destroy({ where: { Id: userId } });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete user due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete user.',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { Email: email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const userRole = await UserRole.findOne({ where: { UserId: user.Id } });
    if (!userRole) {
      return res.status(403).json({ message: 'No role assigned to this user.' });
    }

    const token = jwt.sign(
      { userId: user.Id, roleId: userRole.RoleId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed.' });
  }
};

exports.logout = async (_req, res) => {
  // JWT is stateless, so logout is handled by the frontend clearing the cookie.
  return res.status(200).json({ message: 'Logged out successfully.' });
};
