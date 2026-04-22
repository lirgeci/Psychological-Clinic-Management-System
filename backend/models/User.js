const { DataTypes, Model } = require('sequelize');

class User extends Model {
  static associate(models) {
    User.hasMany(models.UserRole, { foreignKey: 'UserId', as: 'userRoles' });
    User.hasMany(models.UserClaim, { foreignKey: 'UserId', as: 'userClaims' });
    User.hasMany(models.UserToken, { foreignKey: 'UserId', as: 'userTokens' });
    User.hasMany(models.RefreshToken, { foreignKey: 'UserId', as: 'refreshTokens' });
  }
}

module.exports = (sequelize) => {
  User.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      Email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      PasswordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'Users',
      timestamps: false,
    }
  );

  return User;
};
