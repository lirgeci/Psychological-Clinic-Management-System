const { DataTypes, Model } = require('sequelize');

class SessionNote extends Model {
  static associate(models) {
    SessionNote.belongsTo(models.Session, { foreignKey: 'SessionId' });
  }
}

module.exports = (sequelize) => {
  SessionNote.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      SessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      Notes: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      Progress: {
        type: DataTypes.TEXT,
      },
      Homework: {
        type: DataTypes.TEXT,
      },
      NextPlan: {
        type: DataTypes.TEXT,
      },
      CreatedDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'SessionNotes',
      timestamps: false,
    }
  );

  return SessionNote;
};
