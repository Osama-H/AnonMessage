const { DataTypes, Model } = require("sequelize");
const User = require("./userModel");

const db = require("../config/database");

class Message extends Model {}

Message.init(
  {
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    asAnonSender: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    asAnonymousSender: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: "Message",
  }
);

Message.belongsTo(User, {
  as: "sender",
  foreignKey: "sender_id",
});

Message.belongsTo(User, {
  as: "recipient",
  foreignKey: "recipient_id",
});

User.hasMany(Message, {
  as: "sendMessages",
  foreignKey: "sender_id",
});

User.hasMany(Message, {
  as: "receivedMessages",
  foreignKey: "recipient_id",
});

module.exports = Message;
