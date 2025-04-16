const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

const login = (req, res, next) => {
  const { username, password } = req.body;

  userModel.lookup(username, (err, user) => {
    if (err) {
      req.flash('error', 'An error occurred during login');
      return res.redirect('/login');
    }

    if (user == null) {
      req.flash('error', 'Username not found');
      return res.redirect('/login');
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const payload = { username };
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: 300,
        });
        res.cookie('jwt', accessToken);
        return res.redirect('/admin'); 
      } else {
        req.flash('error', 'Incorrect password');
        return res.redirect('/login');
      }
    });
  });
};

const verify = (req, res, next) => {
  const { jwt: accessToken } = req.cookies;
  
  if (!accessToken) {
    return res.status(403).redirect('/login');
  }
  
  try {
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch (e) {
    res.clearCookie('jwt');
    res.status(401).redirect('/login');
  }
};

module.exports = { login, verify };