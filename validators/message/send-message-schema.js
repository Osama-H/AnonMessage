const joi = require("joi");

const sendMessageSchema = joi.object({
  text: joi.string().required(),
  asAnonymousSender: joi.boolean(),
  recipient_id: joi.number().required(),
});

module.exports = sendMessageSchema;
