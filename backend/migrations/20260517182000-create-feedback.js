'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Feedback', {
      Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      SessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Sessions', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      PatientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      TherapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Therapists', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      Rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      Comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Feedback');
  },
};