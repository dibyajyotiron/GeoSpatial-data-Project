const winston = require("winston"),
  mongoose = require("mongoose");
module.exports = function() {
  mongoose
    .connect(
      "mongodb://localhost:27017/auth_user",
      // "mongodb://dibyajyoti_ghosal:Aparnaroy2011@ds215633.mlab.com:15633/nodejs_interview",
      { useNewUrlParser: true }
    )
    .then(() => {
      winston.info("Database connected!");
    })
    .catch(err => {
      console.error(`${err.name}: MongoDB connection to server failed!`);
    });
};

// DB keys are provided just for this interview, in real world application,
// it should be kept in environment variables!
