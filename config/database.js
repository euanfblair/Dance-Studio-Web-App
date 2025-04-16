const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Created data directory');
}

module.exports = {
  danceDbPath: path.join(dataDir, 'dance.db'),
  userDbPath: path.join(dataDir, 'users.db')
};