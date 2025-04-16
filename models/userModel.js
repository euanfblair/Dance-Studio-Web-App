const Datastore = require('gray-nedb');
const bcrypt = require('bcrypt');
const { userDbPath } = require('../config/database');
const saltRounds = 10;

class UserModel {
  constructor(dbFilePath) {
    this.db = dbFilePath 
      ? new Datastore({ filename: dbFilePath, autoload: true })
      : new Datastore();
  }

  async init() {
    try {
      const adminUser = await this.findByUsername('admin');
      
      if (adminUser) {
        console.log('Admin user already exists');
        return;
      }

      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, saltRounds);

      this.db.insert({
        user: 'admin',
        password: hashedPassword,
        createdAt: new Date(),
      });

      console.log('Admin user created successfully');
    } catch (err) {
      throw err;
    }
  }

  findByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ user: username }, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  }

  lookup(username, cb) {
    this.db.find({ user: username }, (err, entries) => {
      if (err || entries.length === 0) {
        return cb(null, null);
      }
      return cb(null, entries[0]);
    });
  }
  
  async getAdminCount() {
    return new Promise((resolve, reject) => {
      this.db.count({}, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }
  
  async getAllAdmins() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, admins) => {
        if (err) {
          reject(err);
        } else {
          const safeAdmins = admins.map(admin => ({
            _id: admin._id,
            username: admin.user,
            createdAt: admin.createdAt
          }));
          resolve(safeAdmins);
        }
      });
    });
  }
  
  async deleteAdmin(adminId) {
    if (!adminId) {
      throw new Error('Admin ID is required');
    }

    try {
      const count = await this.getAdminCount();
      if (count <= 1) {
        throw new Error('Cannot delete the last administrator account');
      }

      return new Promise((resolve, reject) => {
        this.db.remove({ _id: adminId }, {}, (err, numRemoved) => {
          if (err) {
            reject(err);
          } else if (numRemoved === 0) {
            reject(new Error('Admin not found or could not be deleted'));
          } else {
            resolve({
              success: true,
              message: 'Administrator deleted successfully'
            });
          }
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async create(username, password) {
    try {
      const hash = await bcrypt.hash(password, saltRounds);
      const newUser = {
        user: username,
        password: hash,
        createdAt: new Date()
      };
      
      return new Promise((resolve, reject) => {
        this.db.insert(newUser, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(newUser);
          }
        });
      });
    } catch (err) {
      throw err;
    }
  }
}

const userModel = new UserModel(userDbPath);
userModel.init();

module.exports = userModel;