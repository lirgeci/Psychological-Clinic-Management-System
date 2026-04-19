const { DataTypes, Model } = require('sequelize');

class Invoice extends Model {
  static associate(models) {
    Invoice.belongsTo(models.Patient, { foreignKey: 'PatientId' });
    Invoice.belongsTo(models.Session, { foreignKey: 'SessionId' });
  }
}

module.exports = (sequelize) => {
  Invoice.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      PatientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      SessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      Discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      FinalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      InvoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      PaymentStatus: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Pending',
      },
    },
    {
      sequelize,
      tableName: 'Invoices',
      timestamps: false,
    }
  );

  return Invoice;
};
