const User = require("../models/User");

const isAuthentificated = async (req, res, next) => {
  try {
    //console.log("OK");
    if (req.headers.authorization) {
      //console.log(req.headers.authorization);
      const token = req.headers.authorization.replace("Bearer ", "");
      //console.log(token);
      const user = await User.findOne({ token: token }).select("account _id");
      //console.log(user);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).json({ error: "unauthorized" });
      }
    } else {
      res.status(401).json({ error: "unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = isAuthentificated;
