const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const { jwt: accessToken } = req.cookies;
  
  if (accessToken) {
    try {
      jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      res.locals.isLoggedIn = true;
    } catch (e) {
      res.locals.isLoggedIn = false;
    }
  } else {
    res.locals.isLoggedIn = false;
  }
  
  next();
};