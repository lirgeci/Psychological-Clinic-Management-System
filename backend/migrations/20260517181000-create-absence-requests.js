'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AbsenceRequests', {
      Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      TherapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Therapists', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      FromDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ToDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      Reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      Status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Pending',
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('AbsenceRequests');
  },
};