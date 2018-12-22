const { User } = require("../models/user"),
  { pick } = require("lodash"),
  Joi = require("joi"),
  bcrypt = require("bcrypt"),
  express = require("express"),
  asyncMiddleware = require("../middleware/async"),
  router = express.Router();

// Login

router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(404)
        .send("User with given email id is not registered!");

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) return res.status(400).send("Invalid password!");

    const token = user.generateAuthToken();

    // res.send(token);
    return res
      .header("x-auth-token", token)
      .send(pick(user, ["_id", "name", "email"]));
  })
);

// Logout

// As the token is not stored on the server as tokens are used to give access to protected routes, there is no option of deleting the token, so log out should be implemented on the client. Tokens should never be stored in the database as a plain text.

// Validate user input

function validate(user) {
  const schema = {
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

module.exports = router;
