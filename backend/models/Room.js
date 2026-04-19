const { DataTypes, Model } = require('sequelize');

class Room extends Model {
  static associate(models) {
    Room.hasMany(models.Appointment, { foreignKey: 'RoomId', as: 'appointments' });
  }
}

module.exports = (sequelize) => {
  Room.init({
    Id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Name: { type: DataTypes.STRING, allowNull: false },
    Floor: { type: DataTypes.INTEGER },
    Type: { type: DataTypes.STRING },
    Capacity: { type: DataTypes.INTEGER },
    Equipment: { type: DataTypes.TEXT },
    Status: { type: DataTypes.STRING, defaultValue: 'Available' }
  }, { sequelize, tableName: 'Rooms', timestamps: false });
  return Room;
};