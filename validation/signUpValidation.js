const Joi = require("@hapi/joi");

const stepOne = data => {
  const schema = Joi.object({
    name: Joi.string()
      .max(50)
      .allow(""),
    username: Joi.string()
      .min(4)
      .max(15)
      .required(),
    email: Joi.string()
      .email()
      .required()
  });
  return schema.validate(data);
};

const stepTwo = data => {
  const schema = Joi.object({
    bio: Joi.string()
      .max(160)
      .allow("")
  });

  return schema.validate(data);
};

const stepFour = data => {
  const schema = Joi.object({
    name: Joi.string()
      .max(50)
      .allow(""),
    username: Joi.string()
      .min(4)
      .max(15)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    bio: Joi.string()
      .max(160)
      .allow(""),
    profilePictureUrl: Joi.string().allow(""),
    password: Joi.string()
      .min(6)
      .pattern(
        new RegExp(/[^\w\d]*(([0-9]+.*[A-Za-z]+.*)|[A-Za-z]+.*([0-9]+.*))/)
      )
      .message("Password must contain at least 1 letter and 1 number")
      .required()
  });

  return schema.validate(data);
};

module.exports = { stepOne, stepTwo, stepFour };
