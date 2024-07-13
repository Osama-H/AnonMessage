const joi = require("joi");

const userLoginSchema = joi.object({
  email: joi.string().required(),
  password: joi.string().required(),
});

module.exports = userLoginSchema;
