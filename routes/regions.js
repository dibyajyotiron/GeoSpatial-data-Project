const { Region, validate } = require("../models/region"),
  asyncMiddleware = require("../middleware/async"),
  mongoose = require("mongoose"),
  auth = require("../middleware/auth"),
  express = require("express"),
  router = express.Router(),
  Joi = require("joi"),
  uuid = require("uuid/v1");

router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ err: true, reason: error.details[0].message });

    const { _id: id } = req.user;
    const { name, description, location } = req.body;

    const region = new Region({
      uid: uuid(),
      name,
      description,
      location,
      _owner: id
    });
    const saved = await region.save();
    return res.json({ err: false, region: saved });
  })
);

router.get(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { _id: userId } = req.user;
    const regions = await Region.find({ _owner: userId });
    return res.json({ err: false, regions });
  })
);

router.get(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: regionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(regionId))
      return res.status(404).json({
        err: true,
        message:
          "No region exist for the current user with the given region id!"
      });
    const regions = await Region.findOne({ _id: regionId });
    if (!regions)
      return res.status(404).json({
        err: false,
        message:
          "No region exist for the current user with the given region id!"
      });
    return res.json({ err: false, regions });
  })
);

router.put(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: regionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(regionId))
      return res.status(404).json({
        err: true,
        message:
          "No region exist for the current user with the given region id!"
      });

    const foundRegion = await Region.findOne({ _id: regionId });
    if (!foundRegion)
      return res.status(404).json({
        err: false,
        message:
          "No region exist for the current user with the given region id!"
      });

    if (req.body.name) {
      foundRegion.name = req.body.name;
    }

    if (req.body.location) {
      const locationSchema = {
        type: Joi.string()
          .required()
          .label("Location type")
          .valid(["Point"]),
        coordinates: Joi.array()
          .items(Joi.number())
          .min(2)
          .required()
          .label("Location co-ordinates")
      };
      const { error } = Joi.validate(req.body.location, locationSchema);
      if (error)
        return res
          .status(400)
          .json({ err: true, reason: error.details[0].message });
      foundRegion.location = req.body.location;
    }

    if (req.body.description) {
      foundRegion.description = req.body.description;
    }

    const updatedRegion = await foundRegion.save();
    return res.json({ err: false, region: updatedRegion });
  })
);

router.delete(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: regionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(regionId))
      return res.status(404).json({
        err: true,
        message:
          "No region exist for the current user with the given region id!"
      });

    await Region.findOneAndRemove(regionId);
    return res.json({
      err: false,
      message: "Successfully removed the region!"
    });
  })
);
module.exports = router;
