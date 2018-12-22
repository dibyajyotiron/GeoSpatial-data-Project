const mongoose = require("mongoose"),
  jwt = require("jsonwebtoken"),
  Joi = require("joi");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 255
  }
});

function validate(user) {
  const schema = {
    name: Joi.string()
      .min(2)
      .max(20)
      .required(),
    email: Joi.string()
      .min(5)
      .max(50)
      .required()
      .email(),
    password: Joi.string()
      .min(8)
      .max(255)
      .required()
  };
  return Joi.validate(user, schema);
}

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email
    },
    process.env.Jwt_Auth_Secret,
    {
      expiresIn: "1d"
    }
  );
  return token;
};
mongoose.set("useCreateIndex", true);

module.exports.User = mongoose.model("user", userSchema);
module.exports.validate = validate;
