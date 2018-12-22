const { User, validate } = require("../models/user"),
  _ = require("lodash"),
  bcrypt = require("bcrypt"),
  express = require("express"),
  asyncMiddleware = require("../middleware/async"),
  router = express.Router();

// Sign Up User

// POST to /user/register,
// In Postman, use Raw and pass in email, name and password
// as a JSON formatted doc.
// Before sending POST request, create a file in root,
// name it .env and add this line ->
// Jwt_Auth_Secret="your secret"
// Otherwise you'll get error!

router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("User already exists!");

    user = new User(_.pick(req.body, ["name", "email", "password"]));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    console.log(user);

    const token = user.generateAuthToken();

    return res.header("x-auth-token", token).send(_.pick(user, ["_id"]));
  })
);

module.exports = router;
