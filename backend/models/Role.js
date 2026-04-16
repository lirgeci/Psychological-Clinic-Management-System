const { DataTypes, Model } = require('sequelize');

class Role extends Model {
  static associate(models) {
    Role.hasMany(models.UserRole, { foreignKey: 'RoleId', as: 'userRoles' });
  }
}

module.exports = (sequelize) => {
  Role.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      Name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      tableName: 'Roles',
      timestamps: false,
    }
  );

  return Role;
};
