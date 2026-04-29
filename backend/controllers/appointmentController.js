const { Appointment, Patient, Therapist, Room, sequelize } = require('../models');

const REQUIRED_FIELDS = [
  'patientId',
  'therapistId',
  'date',
  'time',
  'type',
  'status',
];

exports.createAppointment = async (req, res) => {
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
    patientId,
    therapistId,
    date,
    time,
    durationMinutes,
    type,
    status,
    roomId,
    cancellationReason,
  } = req.body;

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const patient = await Patient.findByPk(patientId, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const therapist = await Therapist.findByPk(therapistId, { transaction });
    if (!therapist) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Therapist not found.' });
    }

    if (roomId !== undefined && roomId !== null && roomId !== '') {
      const room = await Room.findByPk(roomId, { transaction });
      if (!room) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Room not found.' });
      }
    }

    const appointment = await Appointment.create(
      {
        PatientId: patientId,
        TherapistId: therapistId,
        AppointmentDate: date,
        AppointmentTime: time,
        DurationMinutes: durationMinutes || null,
        Type: type,
        Status: status,
        RoomId: roomId || null,
        CancellationReason: cancellationReason || null,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: 'Appointment created successfully.',
      appointment,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to create appointment.',
    });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;

    const total = await Appointment.count();
    const appointments = await Appointment.findAll({
      include: [
        {
          model: Patient,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Room,
          as: 'room',
          attributes: ['Id', 'Name', 'Type'],
        },
      ],
      offset,
      limit,
      order: [['AppointmentDate', 'ASC'], ['AppointmentTime', 'ASC']],
    });

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch appointments.',
    });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = Number(req.params.appointmentId);
    if (!Number.isInteger(appointmentId) || appointmentId < 1) {
      return res.status(400).json({ message: 'Invalid appointmentId format.' });
    }

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: Patient,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Room,
          as: 'room',
          attributes: ['Id', 'Name', 'Type'],
        },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch appointment.',
    });
  }
};

exports.updateAppointment = async (req, res) => {
  let transaction;

  try {
    const appointmentId = Number(req.params.appointmentId);
    if (!Number.isInteger(appointmentId) || appointmentId < 1) {
      return res.status(400).json({ message: 'Invalid appointmentId format.' });
    }

    const {
      patientId,
      therapistId,
      date,
      time,
      durationMinutes,
      type,
      status,
      roomId,
      cancellationReason,
    } = req.body;

    if (
      patientId === undefined &&
      therapistId === undefined &&
      date === undefined &&
      time === undefined &&
      durationMinutes === undefined &&
      type === undefined &&
      status === undefined &&
      roomId === undefined &&
      cancellationReason === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();

    const existingAppointment = await Appointment.findByPk(appointmentId, { transaction });
    if (!existingAppointment) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const updatePayload = {};

    if (patientId !== undefined) {
      const patient = await Patient.findByPk(patientId, { transaction });
      if (!patient) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Patient not found.' });
      }
      updatePayload.PatientId = patientId;
    }

    if (therapistId !== undefined) {
      const therapist = await Therapist.findByPk(therapistId, { transaction });
      if (!therapist) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Therapist not found.' });
      }
      updatePayload.TherapistId = therapistId;
    }

    if (date !== undefined) updatePayload.AppointmentDate = date;
    if (time !== undefined) updatePayload.AppointmentTime = time;
    if (durationMinutes !== undefined) updatePayload.DurationMinutes = durationMinutes;
    if (type !== undefined) updatePayload.Type = type;
    if (status !== undefined) updatePayload.Status = status;
    if (cancellationReason !== undefined) updatePayload.CancellationReason = cancellationReason;

    if (roomId !== undefined) {
      if (roomId === null || roomId === '') {
        updatePayload.RoomId = null;
      } else {
        const room = await Room.findByPk(roomId, { transaction });
        if (!room) {
          await transaction.rollback();
          return res.status(404).json({ message: 'Room not found.' });
        }
        updatePayload.RoomId = roomId;
      }
    }

    await Appointment.update(updatePayload, {
      where: { Id: appointmentId },
      transaction,
    });

    const updatedAppointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: Patient,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Therapist,
          attributes: ['Id', 'FirstName', 'LastName', 'Email'],
        },
        {
          model: Room,
          as: 'room',
          attributes: ['Id', 'Name', 'Type'],
        },
      ],
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: 'Appointment updated successfully.',
      appointment: updatedAppointment,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update appointment.',
    });
  }
};

exports.deleteAppointment = async (req, res) => {
  let transaction;

  try {
    const appointmentId = Number(req.params.appointmentId);
    if (!Number.isInteger(appointmentId) || appointmentId < 1) {
      return res.status(400).json({ message: 'Invalid appointmentId format.' });
    }

    transaction = await sequelize.transaction();

    const appointment = await Appointment.findByPk(appointmentId, { transaction });
    if (!appointment) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    await Appointment.destroy({ where: { Id: appointmentId }, transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete appointment due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete appointment.',
    });
  }
};
