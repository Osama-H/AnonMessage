const joi = require("joi");

const forgotPasswordSchema = joi.object({
  email: joi.string().required(),
});

module.exports = forgotPasswordSchema;
