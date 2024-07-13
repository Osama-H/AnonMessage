const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const db = require("../config/database");

class User extends Model {}

User.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: DataTypes.STRING,
    photo: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        const hashedPassword = bcrypt.hashSync(value, 10);
        this.setDataValue("password", hashedPassword);
      },
    },
    passwordResetToken: DataTypes.STRING,
    passwordResetExpires: DataTypes.DATE,
    refreshToken: {
      type: DataTypes.STRING,
    },
    bio: DataTypes.TEXT,
  },
  {
    sequelize: db,
    modelName: "User",
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        fields: ["name"],
      },
    ],
  }
);

User.prototype.comparePassword = async function (enteredPass) {
  return await bcrypt.compare(enteredPass, this.password);
};

User.prototype.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await this.save();

  return resetToken;
};

module.exports = User;
