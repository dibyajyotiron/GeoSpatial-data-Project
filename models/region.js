const mongoose = require("mongoose");
const Joi = require("joi");

const regionSchema = new mongoose.Schema({
  uid: String,
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: { type: String, trim: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }
});

function validate(region) {
  const schema = {
    name: Joi.string().required(),
    description: Joi.string(),
    location: Joi.object({
      type: Joi.string()
        .required()
        .label("Location type")
        .valid("Point"),
      coordinates: Joi.array()
        .items(Joi.number())
        .min(2)
        .required()
        .label("Location co-ordinates")
    }).required()
  };
  return Joi.validate(region, schema);
}

module.exports.Region = mongoose.model("Region", regionSchema);
module.exports.validate = validate;
