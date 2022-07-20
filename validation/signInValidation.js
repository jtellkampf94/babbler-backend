const Joi = require("@hapi/joi");

const signUp = data => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
  });
  return schema.validate(data);
};

module.exports = signUp;
