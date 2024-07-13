const joi = require("joi");

const updatePasswordSchema = joi.object({
  currentPassword: joi.string().required(),

  newPassword: joi
    .string()
    .required()
    .pattern(new RegExp("^(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]{8,14}$")),
});

module.exports = updatePasswordSchema;
