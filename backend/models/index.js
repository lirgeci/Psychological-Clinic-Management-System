const { Sequelize } = require('sequelize');
const rawConfig = require('../config/database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = rawConfig[env] || rawConfig;

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Phase 1 - Identity System
db.User = require('./User')(sequelize);
db.Role = require('./Role')(sequelize);
db.UserRole = require('./UserRole')(sequelize);
db.UserClaim = require('./UserClaim')(sequelize);
db.UserToken = require('./UserToken')(sequelize);
db.RefreshToken = require('./RefreshToken')(sequelize);

// Phase 2 - Core Entities & Scheduling
db.Room = require('./Room')(sequelize);
db.Questionnaire = require('./Questionnaire')(sequelize);
db.Patient = require('./patient')(sequelize);
db.Therapist = require('./therapist')(sequelize);
db.Appointment = require('./Appointment')(sequelize);
db.Session = require('./Session')(sequelize);

// Phase 3 - Clinical & Financial
db.Diagnosis = require('./Diagnosis')(sequelize);
db.TreatmentPlan = require('./TreatmentPlan')(sequelize);
db.SessionNote = require('./SessionNote')(sequelize);
db.QuestionnaireResponse = require('./QuestionnaireResponse')(sequelize);
db.Invoice = require('./Invoice')(sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

module.exports = db;
