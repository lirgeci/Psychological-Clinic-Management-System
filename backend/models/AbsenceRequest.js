const { DataTypes, Model } = require('sequelize');

class AbsenceRequest extends Model {
  static associate(models) {
    AbsenceRequest.belongsTo(models.Therapist, { foreignKey: 'TherapistId' });
  }
}

module.exports = (sequelize) => {
  AbsenceRequest.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      TherapistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Therapists',
          key: 'Id',
        },
      },
      FromDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      ToDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      Reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      Status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Pending',
      },
      CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'AbsenceRequests',
      timestamps: false,
    }
  );

  return AbsenceRequest;
};