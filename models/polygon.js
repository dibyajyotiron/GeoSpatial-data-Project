const mongoose = require("mongoose");
const Joi = require("joi");

const polygonSchema = new mongoose.Schema({
  uid: String,
  name: {
    type: String,
    required: true
  },
  description: String,
  classId: {
    type: Number,
    default: 100,
    required: true
  },
  className: {
    type: String,
    required: true
  },
  polygon: {
    type: {
      type: String,
      enum: ["Polygon"],
      required: true
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  _region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Region"
  },
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }
});
function validateVector(polygonCoordinates) {
  let coordinate = polygonCoordinates.map(el => {
    let length = el.length;
    let first = el[0];
    let last = el[length - 1];
    if (first.length !== last.length)
      return "First and last co-ordinates should be equal";
    return JSON.stringify(first) === JSON.stringify(last);
  });
  return coordinate;
}

function validate(polygon) {
  const schema = {
    name: Joi.string()
      .min(2)
      .max(20)
      .required(),
    description: Joi.string(),
    className: Joi.string().required(),
    polygon: Joi.object({
      type: Joi.string()
        .required()
        .label("Location type")
        .valid(["Polygon"]),
      coordinates: Joi.array()
        .items(
          Joi.array()
            .items(
              Joi.array()
                .min(2)
                .label("Co-ordinates")
            )
            .min(4)
            .label("Co-ordinates")
        )
        .required()
        .label("Location co-ordinates")
    }).required()
  };
  return Joi.validate(polygon, schema);
}

module.exports.Polygon = mongoose.model("Polygon", polygonSchema);
module.exports.validate = validate;
module.exports.validateVector = validateVector;
