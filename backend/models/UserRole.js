const { DataTypes, Model } = require('sequelize');

class UserRole extends Model {
  static associate(models) {
    UserRole.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });
    UserRole.belongsTo(models.Role, { foreignKey: 'RoleId', as: 'role' });
  }
}

module.exports = (sequelize) => {
  UserRole.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      RoleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      sequelize,
      tableName: 'UserRoles',
      timestamps: false,
    }
  );

  return UserRole;
};
