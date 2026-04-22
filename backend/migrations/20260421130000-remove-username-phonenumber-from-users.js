'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('Users', 'UserName');
    await queryInterface.removeColumn('Users', 'PhoneNumber');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'UserName', {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn('Users', 'PhoneNumber', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },
};
