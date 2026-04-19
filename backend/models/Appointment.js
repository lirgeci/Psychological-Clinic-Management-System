const { DataTypes, Model } = require('sequelize');

class Appointment extends Model {
  static associate(models) {
    Appointment.belongsTo(models.Patient, { foreignKey: 'PatientId' });
    Appointment.belongsTo(models.Therapist, { foreignKey: 'TherapistId' });
  }
}

module.exports = (sequelize) => {
  Appointment.init({
    Id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    PatientId: { type: DataTypes.INTEGER, allowNull: false },
    TherapistId: { type: DataTypes.INTEGER, allowNull: false },
    AppointmentDate: { type: DataTypes.DATEONLY, allowNull: false },
    AppointmentTime: { type: DataTypes.TIME, allowNull: false },
    DurationMinutes: { type: DataTypes.INTEGER },
    Type: { type: DataTypes.STRING },
    Status: { type: DataTypes.STRING },
    CancellationReason: { type: DataTypes.TEXT }
  }, { sequelize, tableName: 'Appointments', timestamps: false });
  return Appointment;
};