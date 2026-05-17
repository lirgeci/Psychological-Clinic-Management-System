const { DataTypes, Model } = require('sequelize');

class Announcement extends Model {
  static associate(models) {
    Announcement.belongsTo(models.User, { foreignKey: 'UserId' });
  }
}

module.exports = (sequelize) => {
  Announcement.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      Title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      Message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'Id',
        },
      },
      CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ExpiresAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'Announcements',
      timestamps: false,
    }
  );

  return Announcement;
};