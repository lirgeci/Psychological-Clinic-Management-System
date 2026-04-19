const { DataTypes, Model } = require('sequelize');

class Diagnosis extends Model {
  static associate(models) {
    Diagnosis.belongsTo(models.Patient, { foreignKey: 'PatientId' });
    Diagnosis.belongsTo(models.Therapist, { foreignKey: 'TherapistId' });
    Diagnosis.hasMany(models.TreatmentPlan, { foreignKey: 'DiagnosisId' });
  }
}

module.exports = (sequelize) => {
  Diagnosis.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      PatientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      TherapistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      DiagnosisCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      Name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      Description: {
        type: DataTypes.TEXT,
      },
      DiagnosisDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      Severity: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'Diagnoses',
      timestamps: false,
    }
  );

  return Diagnosis;
};
