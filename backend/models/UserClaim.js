const { DataTypes, Model } = require('sequelize');

class UserClaim extends Model {
  static associate(models) {
    UserClaim.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });
  }
}

module.exports = (sequelize) => {
  UserClaim.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ClaimType: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ClaimValue: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'UserClaims',
      timestamps: false,
    }
  );

  return UserClaim;
};
