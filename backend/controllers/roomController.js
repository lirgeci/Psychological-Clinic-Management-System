const { Room, Appointment, sequelize } = require('../models');

const REQUIRED_FIELDS = ['name', 'type'];

exports.createRoom = async (req, res) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  const { name, floor, type, capacity, equipment, status } = req.body;

  try {
    const room = await Room.create({
      Name: name,
      Floor: floor || null,
      Type: type,
      Capacity: capacity || null,
      Equipment: equipment || null,
      Status: status || 'Available',
    });

    return res.status(201).json({
      message: 'Room created successfully.',
      room,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create room.',
    });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        message: 'Invalid pagination values. page and limit must be positive integers.',
      });
    }

    const offset = (page - 1) * limit;
    const total = await Room.count();
    const rooms = await Room.findAll({
      offset,
      limit,
      order: [['Name', 'ASC']],
    });

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: 'No rooms found.' });
    }

    return res.status(200).json({
      count: total,
      page,
      limit,
      rooms,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch rooms.',
    });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId) || roomId < 1) {
      return res.status(400).json({ message: 'Invalid roomId format.' });
    }

    const room = await Room.findByPk(roomId, {
      include: [
        {
          model: Appointment,
          as: 'appointments',
        },
      ],
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    return res.status(200).json(room);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch room.',
    });
  }
};

exports.updateRoom = async (req, res) => {
  let transaction;

  try {
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId) || roomId < 1) {
      return res.status(400).json({ message: 'Invalid roomId format.' });
    }

    const { name, floor, type, capacity, equipment, status } = req.body;

    if (
      name === undefined &&
      floor === undefined &&
      type === undefined &&
      capacity === undefined &&
      equipment === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        message: 'At least one field must be provided for update.',
      });
    }

    transaction = await sequelize.transaction();
    const existingRoom = await Room.findByPk(roomId, { transaction });

    if (!existingRoom) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Room not found.' });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.Name = name;
    if (floor !== undefined) updatePayload.Floor = floor;
    if (type !== undefined) updatePayload.Type = type;
    if (capacity !== undefined) updatePayload.Capacity = capacity;
    if (equipment !== undefined) updatePayload.Equipment = equipment;
    if (status !== undefined) updatePayload.Status = status;

    await Room.update(updatePayload, {
      where: { Id: roomId },
      transaction,
    });

    const updatedRoom = await Room.findByPk(roomId, { transaction });
    await transaction.commit();

    return res.status(200).json({
      message: 'Room updated successfully.',
      room: updatedRoom,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: error.message || 'Failed to update room.',
    });
  }
};

exports.deleteRoom = async (req, res) => {
  let transaction;

  try {
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId) || roomId < 1) {
      return res.status(400).json({ message: 'Invalid roomId format.' });
    }

    transaction = await sequelize.transaction();
    const existingRoom = await Room.findByPk(roomId, { transaction });

    if (!existingRoom) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Room not found.' });
    }

    await Room.destroy({ where: { Id: roomId }, transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully.',
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete room due to related records.',
      });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete room.',
    });
  }
};
