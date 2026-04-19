const { DataTypes, Model } = require('sequelize');

class TreatmentPlan extends Model {
  static associate(models) {
    TreatmentPlan.belongsTo(models.Patient, { foreignKey: 'PatientId' });
    TreatmentPlan.belongsTo(models.Therapist, { foreignKey: 'TherapistId' });
    TreatmentPlan.belongsTo(models.Diagnosis, { foreignKey: 'DiagnosisId' });
  }
}

module.exports = (sequelize) => {
  TreatmentPlan.init(
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
      DiagnosisId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      Name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      Objectives: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      StartDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      EndDate: {
        type: DataTypes.DATE,
      },
      Status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Active',
      },
    },
    {
      sequelize,
      tableName: 'TreatmentPlans',
      timestamps: false,
    }
  );

  return TreatmentPlan;
};
