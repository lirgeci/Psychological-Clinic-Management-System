const { DataTypes, Model } = require('sequelize');

class Patient extends Model {
  static associate(models) {
    Patient.hasMany(models.Session, { foreignKey: 'patientId' });
    Patient.hasMany(models.Diagnosis, { foreignKey: 'patientId' });
    Patient.hasMany(models.TreatmentPlan, { foreignKey: 'patientId' });
    Patient.hasMany(models.Appointment, { foreignKey: 'patientId' });
    Patient.hasMany(models.Invoice, { foreignKey: 'patientId' });
    Patient.hasMany(models.QuestionnaireResponse, { foreignKey: 'patientId' });
  }
}

module.exports = (sequelize) => {
  Patient.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      FirstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      LastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      Phone: {
        type: DataTypes.STRING,
      },
      DateOfBirth: {
        type: DataTypes.DATE,
      },
      Gender: {
        type: DataTypes.STRING,
      },
      Address: {
        type: DataTypes.STRING,
      },
      EmergencyContact: {
        type: DataTypes.STRING,
      },
      RegistrationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'Patients',
      timestamps: false,
    }
  );

  return Patient;
};