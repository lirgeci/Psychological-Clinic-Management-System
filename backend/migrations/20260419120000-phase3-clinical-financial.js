'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Diagnoses', {
      Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
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
      DiagnosisCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      Name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      Description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      DiagnosisDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      Severity: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    });

    await queryInterface.createTable('TreatmentPlans', {
      Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
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
      DiagnosisId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Diagnoses', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      Name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      Objectives: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      StartDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      EndDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      Status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Active',
      },
    });

    await queryInterface.createTable('SessionNotes', {
      Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      SessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Sessions', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      Notes: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      Progress: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      Homework: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      NextPlan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      CreatedDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('QuestionnaireResponses', {
      Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      QuestionnaireId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Questionnaires', key: 'Id' },
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
      AnswersJson: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      TotalScore: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      CompletedDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('Invoices', {
      Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      PatientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      SessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Sessions', key: 'Id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      Amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      Discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      FinalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      InvoiceDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      PaymentStatus: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Pending',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Invoices');
    await queryInterface.dropTable('QuestionnaireResponses');
    await queryInterface.dropTable('SessionNotes');
    await queryInterface.dropTable('TreatmentPlans');
    await queryInterface.dropTable('Diagnoses');
  },
};
