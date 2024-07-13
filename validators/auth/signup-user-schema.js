const joi = require("joi");

const userSignUpSchema = joi.object({
  name: joi.string().required(),
  email: joi
    .string()
    .required()
    .email(),
  password: joi
    .string()
    .required()
    .pattern(new RegExp("^(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]{8,14}$")),
});

module.exports = userSignUpSchema;
