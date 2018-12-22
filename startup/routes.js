const express = require("express"),
  auth = require("../routes/auth"),
  users = require("../routes/users"),
  regions = require("../routes/regions"),
  polygons = require("../routes/polygons"),
  error = require("../middleware/error");

module.exports = function(app) {
  app.use(express.json());
  app.use("/user/register", users); // Sign Up
  app.use("/user/login", auth); // Log In
  app.use("/user/regions", regions); // Regions CRUD
  app.use("/user/polygons", polygons); // Polygons CRUD
  app.use(error);
};
