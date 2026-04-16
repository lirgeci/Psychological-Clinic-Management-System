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

db.User = require('./User')(sequelize);
db.Role = require('./Role')(sequelize);
db.UserRole = require('./UserRole')(sequelize);
db.UserClaim = require('./UserClaim')(sequelize);
db.UserToken = require('./UserToken')(sequelize);
db.RefreshToken = require('./RefreshToken')(sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

module.exports = db;
