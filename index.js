const express = require('express');
const mustache = require('mustache-express');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const routes = require('./routes/DanceRoutes');
const flashMiddleware = require('./middleware/flash');
const authContextMiddleware = require('./middleware/authContext');
const serverConfig = require('./config/server');

require('./models/userModel');
require('./models/danceModel');

const app = express();

app.use(session(serverConfig.sessionOptions));
app.use(cookieParser());
app.use(flash());
app.use(flashMiddleware);
app.use(authContextMiddleware);

app.engine('mustache', mustache());
app.set('view engine', 'mustache');

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);

app.listen(serverConfig.port, () => {
  console.log(`Server Started on Port ${serverConfig.port}`);
});