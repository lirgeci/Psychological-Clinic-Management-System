const { DataTypes, Model } = require('sequelize');

class UserToken extends Model {
  static associate(models) {
    UserToken.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });
  }
}

module.exports = (sequelize) => {
  UserToken.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      LoginProvider: {
        type: DataTypes.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      Name: {
        type: DataTypes.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      Value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'UserTokens',
      timestamps: false,
    }
  );

  return UserToken;
};
