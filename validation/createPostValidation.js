const Joi = require("@hapi/joi");

const createPostValidation = data => {
  const schema = Joi.object({
    text: Joi.string()
      .allow("")
      .max(280),
    imageUrl: Joi.string().allow("")
  });
  return schema.validate(data);
};

module.exports = createPostValidation;
