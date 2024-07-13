const joi = require("joi");

const updateUserSchema = joi.object({
  name: joi.string().min(3),
  photo: joi.string(),
  bio: joi.string(),
});

module.exports = updateUserSchema;
