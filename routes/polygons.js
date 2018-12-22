const { Polygon, validate, validateVector } = require("../models/polygon"),
  Joi = require("joi"),
  mongoose = require("mongoose"),
  asyncMiddleware = require("../middleware/async"),
  auth = require("../middleware/auth"),
  express = require("express"),
  router = express.Router(),
  turf = require("@turf/turf"),
  uuid = require("uuid/v1");

router.post(
  "/:regionId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ err: true, message: error.details[0].message });

    const result = validateVector(req.body.polygon.coordinates)[0];
    if (result === false)
      return res.status(400).json({
        err: true,
        message: "The first and last co-ordinates must be same!"
      });

    const { regionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(regionId))
      return res.status(404).json({
        err: true,
        message:
          "No polygons exist for the current user with the given region id!"
      });

    const { _id: userId } = req.user;
    const { name, description, className, polygon: vector } = req.body;

    const foundPolygons = await Polygon.find({
      _owner: userId
    });

    const polygon = new Polygon({
      uid: uuid(),
      name,
      description,
      className,
      polygon: vector,
      _region: regionId,
      _owner: userId
    });

    if (foundPolygons.length) {
      const classArray = foundPolygons.map(el => el.classId);
      const maxClass = classArray.reduce((el, acc) => {
        return el > acc ? el : acc;
      });
      polygon.classId = maxClass + 1;
    }
    const saved = await polygon.save();
    return res.json({ polygon: saved });
  })
);

router.get(
  "/:regionId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { _id: userId } = req.user;
    const { regionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(regionId))
      return res.status(404).json({
        err: true,
        message:
          "No polygons exist for the current user with the given region id!"
      });

    const polygons = await Polygon.find({
      _owner: userId,
      _region: regionId
    }).lean();
    if (!polygons)
      return res.status(404).json({
        err: false,
        message:
          "No polygons exist for the current user on the given region id!"
      });

    const mappedPolygon = polygons.map(p => {
      let polygon;
      let area;
      let perimeter;
      polygon = turf.polygon(p.polygon.coordinates);
      area = (turf.area(polygon) / 1000000).toFixed(4);
      console.log(area);
      p.area = area;
      perimeter = turf
        .lineDistance(
          turf.lineString(polygon.geometry.coordinates[0], {
            units: "kilometers"
          })
        )
        .toFixed(4);
      p.perimeter = perimeter;
      return p;
    });
    const { queryClass, queryArea, queryPeri, queryRegion } = req.query;

    let filteredByClass;
    let filteredByQa;
    let filteredByQp;
    let filteredByQr;
    if (queryClass) {
      filteredByClass = mappedPolygon.filter(a => a.className === queryClass);
      // return res.json({ err: false, polygons: filteredByClass });
    }
    if (!queryClass) filteredByClass = [...mappedPolygon];
    if (queryArea) {
      filteredByQa = filteredByClass.filter(
        a => a.area.toString() === queryArea
      );
    }
    if (!queryArea) filteredByQa = [...filteredByClass];
    if (queryPeri) {
      filteredByQp = filteredByQa.filter(
        p => p.perimeter.toString() === queryPeri
      );
    }
    if (!queryPeri) filteredByQp = [...filteredByQa];
    if (queryRegion) {
      filteredByQr = filteredByQp.filter(
        r => JSON.stringify(r._region) === JSON.stringify(queryRegion)
      );
    }
    if (!queryRegion) filteredByQr = [...filteredByQp];

    return res.json({ err: false, polygons: filteredByQr });
  })
);

router.get(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { _id: userId } = req.user;
    const polygons = await Polygon.find({
      _owner: userId
    });
    if (!polygons)
      return res.status(404).json({
        err: false,
        message: "No polygons exist for the current user!"
      });
    return res.json({ err: false, polygons });
  })
);

router.put(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: polygonId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(polygonId))
      return res.status(404).json({
        err: true,
        message:
          "No polygons exist for the current user with the given polygon id!"
      });

    const foundPolygon = await Polygon.findOne({ _id: polygonId });
    if (!foundPolygon)
      return res.status(404).json({
        err: false,
        message:
          "No polygons exist for the current user with the given polygon id!"
      });

    if (req.body.name) {
      foundPolygon.name = req.body.name;
    }
    if (req.body.className) {
      foundPolygon.className = req.body.className;
    }

    if (req.body.polygon) {
      const polygonSchema = {
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
      };
      const { error } = Joi.validate(req.body.polygon, polygonSchema);
      if (error)
        return res
          .status(400)
          .json({ err: true, reason: error.details[0].message });
      const result = validateVector(req.body.polygon.coordinates)[0];
      if (result === false) {
        return res.status(400).json({
          err: true,
          message: "The first and last co-ordinates must be same!"
        });
      }
      foundPolygon.polygon = req.body.polygon;
    }

    if (req.body.description) {
      foundPolygon.description = req.body.description;
    }

    const updatedPolygon = await foundPolygon.save();
    return res.json({ err: false, polygon: updatedPolygon });
  })
);

router.delete(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: polygonId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(polygonId))
      return res.status(404).json({
        err: true,
        message:
          "No polygons exist for the current user with the given polygon id!"
      });
    const foundPolygon = await Polygon.findOne({
      _id: polygonId,
      _owner: req.user._id
    });
    if (!foundPolygon)
      return res
        .status(404)
        .json({ err: false, message: "Polygon with given id does not exist!" });
    const allPolyByUser = await Polygon.find({ _owner: req.user._id });
    await Polygon.findOneAndRemove(polygonId);
    allPolyByUser.forEach(async poly => {
      console.log(poly.classId, foundPolygon.classId);
      if (poly.classId > foundPolygon.classId) {
        poly.classId -= 1;
        await poly.save();
      }
    });

    return res.json({
      err: false,
      message: "Successfully deleted the polygon!"
    });
  })
);

module.exports = router;
