const { DataTypes, Model } = require('sequelize');

class RefreshToken extends Model {
  static associate(models) {
    RefreshToken.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });
  }
}

module.exports = (sequelize) => {
  RefreshToken.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      Token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
      },
      Expires: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      Created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      Revoked: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'RefreshTokens',
      timestamps: false,
    }
  );

  return RefreshToken;
};
