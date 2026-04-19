const { DataTypes, Model } = require('sequelize');

class QuestionnaireResponse extends Model {
  static associate(models) {
    QuestionnaireResponse.belongsTo(models.Questionnaire, { foreignKey: 'QuestionnaireId' });
    QuestionnaireResponse.belongsTo(models.Patient, { foreignKey: 'PatientId' });
  }
}

module.exports = (sequelize) => {
  QuestionnaireResponse.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      QuestionnaireId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      PatientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      AnswersJson: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      TotalScore: {
        type: DataTypes.FLOAT,
      },
      CompletedDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'QuestionnaireResponses',
      timestamps: false,
    }
  );

  return QuestionnaireResponse;
};
