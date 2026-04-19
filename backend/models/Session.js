const { DataTypes, Model } = require('sequelize');

class Session extends Model {
  static associate(models) {
    Session.belongsTo(models.Patient, { foreignKey: 'PatientId' });
    Session.belongsTo(models.Therapist, { foreignKey: 'TherapistId' });
    Session.hasOne(models.SessionNote, { foreignKey: 'SessionId' });
    Session.hasMany(models.Invoice, { foreignKey: 'SessionId' });
  }
}

module.exports = (sequelize) => {
  Session.init({
    Id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    PatientId: { type: DataTypes.INTEGER, allowNull: false },
    TherapistId: { type: DataTypes.INTEGER, allowNull: false },
    SessionDate: { type: DataTypes.DATEONLY, allowNull: false },
    StartTime: { type: DataTypes.TIME },
    EndTime: { type: DataTypes.TIME },
    SessionType: { type: DataTypes.STRING },
    Status: { type: DataTypes.STRING },
    PrivateNotes: { type: DataTypes.TEXT },
    PatientNotes: { type: DataTypes.TEXT }
  }, { sequelize, tableName: 'Sessions', timestamps: false });
  return Session;
};