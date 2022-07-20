const Joi = require("@hapi/joi");

const updateUserValidation = data => {
  const schema = Joi.object({
    name: Joi.string()
      .max(50)
      .allow(""),
    username: Joi.string()
      .min(4)
      .max(15)
      .allow(""),
    email: Joi.string()
      .email()
      .allow(""),
    bio: Joi.string()
      .max(160)
      .allow(""),
    profilePictureUrl: Joi.string().allow(""),
    headerImageUrl: Joi.string().allow(""),
    currentPassword: Joi.string().allow(""),
    password: Joi.string()
      .min(6)
      .pattern(
        new RegExp(/[^\w\d]*(([0-9]+.*[A-Za-z]+.*)|[A-Za-z]+.*([0-9]+.*))/)
      )
      .message("Password must contain at least 1 letter and 1 number")
      .allow("")
  });

  return schema.validate(data);
};

module.exports = updateUserValidation;
