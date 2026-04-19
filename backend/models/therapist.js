const { DataTypes, Model } = require('sequelize');

class Therapist extends Model {
  static associate(models) {
    Therapist.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });
    Therapist.hasMany(models.Session, { foreignKey: 'TherapistId' });
    Therapist.hasMany(models.Diagnosis, { foreignKey: 'TherapistId' });
    Therapist.hasMany(models.TreatmentPlan, { foreignKey: 'TherapistId' });
    Therapist.hasMany(models.Appointment, { foreignKey: 'TherapistId' });
  }
}

module.exports = (sequelize) => {
  Therapist.init(
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
      Specialization: {
        type: DataTypes.STRING,
      },
      LicenseNumber: {
        type: DataTypes.STRING,
      },
      Qualifications: {
        type: DataTypes.TEXT,
      },
      EmploymentDate: {
        type: DataTypes.DATE,
      },
      Biography: {
        type: DataTypes.TEXT,
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
      tableName: 'Therapists',
      timestamps: false,
    }
  );

  return Therapist;
};