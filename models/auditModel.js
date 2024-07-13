const { DataTypes, Model } = require("sequelize");

const db = require("../config/database");

class Audit extends Model {}
Audit.init(
  {
    auditAction: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: DataTypes.STRING,
    status: DataTypes.STRING,
    error: DataTypes.STRING,
    auditBy: DataTypes.STRING,
    auditOn: DataTypes.DATE,
  },
  {
    sequelize: db,
    modelName: "Audit",
  }
);
module.exports = Audit;
