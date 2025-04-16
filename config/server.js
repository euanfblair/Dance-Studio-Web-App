const sessionSecret = process.env.SESSION_SECRET || 'dance-studio-secret-key';

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret,
  sessionOptions: {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
  }
};