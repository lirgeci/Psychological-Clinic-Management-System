const { DataTypes, Model } = require('sequelize');

class Patient extends Model {
  static associate(models) {
    Patient.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });
    Patient.hasMany(models.Session, { foreignKey: 'PatientId' });
    Patient.hasMany(models.Diagnosis, { foreignKey: 'PatientId' });
    Patient.hasMany(models.TreatmentPlan, { foreignKey: 'PatientId' });
    Patient.hasMany(models.Appointment, { foreignKey: 'PatientId' });
    Patient.hasMany(models.Invoice, { foreignKey: 'PatientId' });
    Patient.hasMany(models.QuestionnaireResponse, { foreignKey: 'PatientId' });
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
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'Id',
        },
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