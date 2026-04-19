const { DataTypes, Model } = require('sequelize');

class Questionnaire extends Model {
  static associate(models) {
    Questionnaire.hasMany(models.QuestionnaireResponse, { foreignKey: 'QuestionnaireId' });
  }
}

module.exports = (sequelize) => {
  Questionnaire.init({
    Id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Title: { type: DataTypes.STRING, allowNull: false },
    Description: { type: DataTypes.TEXT },
    Type: { type: DataTypes.STRING },
    QuestionsJson: { type: DataTypes.JSON },
    CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { sequelize, tableName: 'Questionnaires', timestamps: false });
  return Questionnaire;
};