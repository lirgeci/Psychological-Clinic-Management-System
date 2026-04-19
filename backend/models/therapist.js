const { DataTypes, Model } = require('sequelize');

class Therapist extends Model {
  static associate(models) {
    Therapist.hasMany(models.Session, { foreignKey: 'therapistId' });
    Therapist.hasMany(models.Diagnosis, { foreignKey: 'therapistId' });
    Therapist.hasMany(models.TreatmentPlan, { foreignKey: 'therapistId' });
    Therapist.hasMany(models.Appointment, { foreignKey: 'therapistId' });
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
    },
    {
      sequelize,
      tableName: 'Therapists',
      timestamps: false,
    }
  );

  return Therapist;
};