'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabela Rooms
    await queryInterface.createTable('Rooms', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      Name: { type: Sequelize.STRING, allowNull: false },
      Floor: { type: Sequelize.INTEGER },
      Type: { type: Sequelize.STRING },
      Capacity: { type: Sequelize.INTEGER },
      Equipment: { type: Sequelize.TEXT },
      Status: { type: Sequelize.STRING, defaultValue: 'Available' }
    });

    // 2. Tabela Questionnaires
    await queryInterface.createTable('Questionnaires', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      Title: { type: Sequelize.STRING, allowNull: false },
      Description: { type: Sequelize.TEXT },
      Type: { type: Sequelize.STRING },
      QuestionsJson: { type: Sequelize.JSON },
      CreatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 3. Tabela Sessions
    await queryInterface.createTable('Sessions', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      PatientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'Id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      TherapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Therapists', key: 'Id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      SessionDate: { type: Sequelize.DATEONLY, allowNull: false },
      StartTime: { type: Sequelize.TIME },
      EndTime: { type: Sequelize.TIME },
      SessionType: { type: Sequelize.STRING },
      Status: { type: Sequelize.STRING },
      PrivateNotes: { type: Sequelize.TEXT },
      PatientNotes: { type: Sequelize.TEXT }
    });

    // 4. Tabela Appointments
    await queryInterface.createTable('Appointments', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      PatientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'Id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      TherapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Therapists', key: 'Id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      AppointmentDate: { type: Sequelize.DATEONLY, allowNull: false },
      AppointmentTime: { type: Sequelize.TIME, allowNull: false },
      DurationMinutes: { type: Sequelize.INTEGER },
      Type: { type: Sequelize.STRING },
      Status: { type: Sequelize.STRING },
      CancellationReason: { type: Sequelize.TEXT }
    });
  },

  async down(queryInterface, Sequelize) {
   
    await queryInterface.dropTable('Appointments');
    await queryInterface.dropTable('Sessions');
    await queryInterface.dropTable('Questionnaires');
    await queryInterface.dropTable('Rooms');
  }
};