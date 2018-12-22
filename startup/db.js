const winston = require("winston"),
  mongoose = require("mongoose");
module.exports = function() {
  mongoose
    .connect(
      "mongodb://localhost:27017/auth_user",
      { useNewUrlParser: true }
    )
    .then(() => {
      winston.info("Database connected!");
    })
    .catch(err => {
      console.error(`${err.name}: MongoDB connection to server failed!`);
    });
};

// DB keys are provided just for this interview as it's local db, in real world application,
// it should be kept in environment variables!
