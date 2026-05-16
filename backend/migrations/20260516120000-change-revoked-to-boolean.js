'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change Revoked column from DATE to BOOLEAN with default false
    return queryInterface.changeColumn('RefreshTokens', 'Revoked', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert Revoked column back to DATE, allow null
    return queryInterface.changeColumn('RefreshTokens', 'Revoked', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },
};
