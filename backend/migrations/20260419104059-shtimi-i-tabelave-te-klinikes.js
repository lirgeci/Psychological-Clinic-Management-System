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
      CreatedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 3. Tabela Patients (depends on Users from Phase 1)
    await queryInterface.createTable('Patients', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      FirstName: { type: Sequelize.STRING, allowNull: false },
      LastName: { type: Sequelize.STRING, allowNull: false },
      Email: { type: Sequelize.STRING, allowNull: false, unique: true },
      Phone: { type: Sequelize.STRING },
      DateOfBirth: { type: Sequelize.DATE },
      Gender: { type: Sequelize.STRING },
      Address: { type: Sequelize.STRING },
      EmergencyContact: { type: Sequelize.STRING },
      RegistrationDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    // 4. Tabela Therapists (depends on Users from Phase 1)
    await queryInterface.createTable('Therapists', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      FirstName: { type: Sequelize.STRING, allowNull: false },
      LastName: { type: Sequelize.STRING, allowNull: false },
      Email: { type: Sequelize.STRING, allowNull: false, unique: true },
      Phone: { type: Sequelize.STRING },
      Specialization: { type: Sequelize.STRING },
      LicenseNumber: { type: Sequelize.STRING },
      Qualifications: { type: Sequelize.TEXT },
      EmploymentDate: { type: Sequelize.DATE },
      Biography: { type: Sequelize.TEXT },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    // 5. Tabela Appointments (depends on Patients, Therapists, Rooms)
    await queryInterface.createTable('Appointments', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      PatientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      TherapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Therapists', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      RoomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Rooms', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      AppointmentDate: { type: Sequelize.DATEONLY, allowNull: false },
      AppointmentTime: { type: Sequelize.TIME, allowNull: false },
      DurationMinutes: { type: Sequelize.INTEGER },
      Type: { type: Sequelize.STRING },
      Status: { type: Sequelize.STRING },
      CancellationReason: { type: Sequelize.TEXT }
    });

    // 6. Tabela Sessions (depends on Patients, Therapists)
    await queryInterface.createTable('Sessions', {
      Id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      PatientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      TherapistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Therapists', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      SessionDate: { type: Sequelize.DATEONLY, allowNull: false },
      StartTime: { type: Sequelize.TIME },
      EndTime: { type: Sequelize.TIME },
      SessionType: { type: Sequelize.STRING },
      Status: { type: Sequelize.STRING },
      PrivateNotes: { type: Sequelize.TEXT },
      PatientNotes: { type: Sequelize.TEXT }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sessions');
    await queryInterface.dropTable('Appointments');
    await queryInterface.dropTable('Therapists');
    await queryInterface.dropTable('Patients');
    await queryInterface.dropTable('Questionnaires');
    await queryInterface.dropTable('Rooms');
  }
};