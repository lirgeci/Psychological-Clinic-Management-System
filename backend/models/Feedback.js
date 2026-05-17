const { DataTypes, Model } = require('sequelize');

class Feedback extends Model {
  static associate(models) {
    Feedback.belongsTo(models.Session, { foreignKey: 'SessionId' });
    Feedback.belongsTo(models.Patient, { foreignKey: 'PatientId' });
    Feedback.belongsTo(models.Therapist, { foreignKey: 'TherapistId' });
  }
}

module.exports = (sequelize) => {
  Feedback.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      SessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Sessions',
          key: 'Id',
        },
      },
      PatientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Patients',
          key: 'Id',
        },
      },
      TherapistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Therapists',
          key: 'Id',
        },
      },
      Rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      Comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'Feedback',
      timestamps: false,
    }
  );

  return Feedback;
};